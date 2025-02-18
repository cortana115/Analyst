import type { Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertSystemPromptSchema, type Domain, domains } from "@shared/schema";
import OpenAI from "openai";
import fs from 'fs';
import { authenticate } from './auth';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processFileForGemini(content: string, fileType: string): Promise<string> {
  if (fileType.startsWith('image/')) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide a detailed description of what you see. Include any relevant details about objects, text, or notable elements in the image."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${content}`
                }
              }
            ],
          },
        ],
      });

      return response.choices[0].message.content || "Could not analyze image";
    } catch (error) {
      console.error('Error processing image with OpenAI:', error);
      throw new Error('Failed to process the image. Please try again or use a different image.');
    }
  }
  return content;
}

function setupSSE(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');
  return res;
}

export function registerRoutes(app: Express): Server {
  // Chat route with streaming support
  app.post("/api/chat", authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const body = insertMessageSchema.parse(req.body);
      const { subFeature } = req.body;

      // Store user message first with user ID
      const userMessage = await storage.createMessage({
        ...body,
        userId: req.user?.id,
      });

      // Set up SSE
      const sseRes = setupSSE(req, res);
      let fullResponse = '';

      try {
        // Get domain-specific prompts
        const domainPrompts = defaultSystemPrompts[body.domain as Domain];
        let systemPrompt: string;

        if (typeof domainPrompts === 'string') {
          systemPrompt = domainPrompts;
        } else {
          systemPrompt = subFeature && domainPrompts &&
            typeof domainPrompts === 'object' &&
            subFeature in domainPrompts
            ? domainPrompts[subFeature as keyof typeof domainPrompts]
            : domainPrompts.default;
        }

        // Get conversation history to check if this is the first message
        const messages = await storage.getMessages(body.threadId);
        const isFirstMessage = messages.length === 1; // Only the current user message exists

        // Prepare messages array for OpenAI
        const openAiMessages = [
          { role: "system", content: systemPrompt },
          ...messages.slice(0, -1).map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          { role: "user", content: body.content }
        ];

        // Create chat completion with streaming
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: openAiMessages,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            sseRes.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Store the complete response
        const aiMessage = await storage.createMessage({
          domain: body.domain,
          role: "assistant",
          content: fullResponse,
          threadId: body.threadId,
          subFeatureId: subFeature,
          timestamp: Math.floor(Date.now() / 1000),
          userId: req.user?.id
        });

        // Send completion event
        sseRes.write(`data: ${JSON.stringify({ done: true, messageId: aiMessage.id })}\n\n`);
        sseRes.end();
      } catch (error) {
        console.error("OpenAI API Error:", error);
        sseRes.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
        sseRes.end();
        throw error;
      }
    } catch (error: unknown) {
      console.error("Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  // Message history endpoint
  app.get("/api/messages/:threadId", authenticate, async (req:Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { threadId } = req.params;
      const messages = await storage.getMessages(threadId);

      // Only return messages that belong to the authenticated user
      const filteredMessages = messages.filter(msg => msg.userId === req.user?.id);
      res.json(filteredMessages);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  // System prompts endpoints
  app.post("/api/system-prompts", async (req, res) => {
    try {
      const body = insertSystemPromptSchema.parse(req.body);
      const prompt = await storage.updateSystemPrompt(body);
      res.json(prompt);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  // File routes
  app.post("/api/files", async (req, res) => {
    try {
      console.log('File upload started:', {
        fileName: req.body.name,
        fileType: req.body.fileType,
        size: req.body.size
      });

      const { content: base64Content, fileType, ...restBody } = req.body;

      try {
        const extractedContent = await extractFileContent(base64Content, fileType);
        console.log('Content extracted successfully');

        const file = await storage.createFile({
          ...restBody,
          content: extractedContent,
          fileType,
          uploadedBy: restBody.isAdminOnly ? 'admin' : 'user',
        });

        res.json(file);
      } catch (extractError) {
        console.error('Content extraction failed:', extractError);
        throw new Error(`File processing failed: ${(extractError as Error).message}`);
      }
    } catch (error: unknown) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.get("/api/files/:domain", async (req, res) => {
    try {
      const domain = req.params.domain as Domain;
      const isAdmin = req.query.admin === 'true';

      const files = await storage.getFiles(domain, isAdmin);
      res.json(files);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Invalid file ID");
      }
      const file = await storage.getFile(id);
      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      res.json(file);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  // Avatar update endpoint
  app.post("/api/domains/:domain/avatar", async (req, res) => {
    try {
      const { domain } = req.params;
      const { avatar, type } = req.body;

      if (!avatar || !type) {
        throw new Error("Avatar image and type are required");
      }

      // Create avatars directory if it doesn't exist
      const avatarsDir = 'public/avatars';
      await fs.promises.mkdir(avatarsDir, { recursive: true });

      // Store avatar in file system
      const extension = type.split('/')[1];
      const avatarPath = `${avatarsDir}/${domain}-avatar.${extension}`;
      const avatarBuffer = Buffer.from(avatar, 'base64');

      await fs.promises.writeFile(avatarPath, avatarBuffer);

      // Update domain config with the correct public path
      const publicPath = `/avatars/${domain}-avatar.${extension}`;
      res.json({ success: true, path: publicPath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function extractFileContent(base64Content: string, fileType: string): Promise<string> {
  try {
    console.log(`Extracting content for file type: ${fileType}`);

    if (fileType.startsWith('image/')) {
      return await processFileForGemini(base64Content, fileType);
    }

    const buffer = Buffer.from(base64Content, 'base64');
    if (fileType === 'text/plain' || fileType === 'text/html') {
      const textContent = buffer.toString('utf-8');
      console.log('Successfully extracted text content');
      return textContent;
    }

    // Default to text extraction for unknown types
    const content = buffer.toString('utf-8');
    console.log('Extracted content using default text extraction');
    return content;
  } catch (error) {
    console.error('Error extracting content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract content from file: ${errorMessage}`);
  }
}

// Domain configuration
const domainConfig = {
  law: {
    subFeatures: [
      { id: "contracts", name: "Contract Analysis", description: "" },
      { id: "compliance", name: "Compliance Check", description: "" },
      { id: "litigation", name: "Litigation Support", description: "" }
    ]
  },
  finance: {
    subFeatures: [
      { id: "portfolio", name: "Portfolio Analysis", description: "" },
      { id: "market", name: "Market Intelligence", description: "" },
      { id: "planning", name: "Financial Planning", description: "" }
    ]
  },
  medicine: {
    subFeatures: [
      { id: "diagnosis", name: "Symptom Analysis", description: "" },
      { id: "treatment", name: "Treatment Plans", description: "" },
      { id: "research", name: "Medical Research", description: "" }
    ]
  }
};