import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Domain definitions
export const domains = {
  LAW: "law",
  FINANCE: "finance",
  MEDICINE: "medicine",
} as const;

export type Domain = typeof domains[keyof typeof domains];

// Onboarding specific types
export const practiceAreas = {
  [domains.LAW]: ['Corporate Law', 'Criminal Defense', 'Family Law', 'Intellectual Property', 'Other'] as const,
  [domains.FINANCE]: ['Retail Banking', 'Investment Banking', 'Wealth Management', 'Risk Analysis', 'Other'] as const,
  [domains.MEDICINE]: ['General Practice', 'Surgery', 'Pediatrics', 'Cardiology', 'Other'] as const,
} as const;

export type PracticeArea = typeof practiceAreas[Domain][number];

// File categories
export const fileCategories = {
  REFERENCE: "reference",
  KNOWLEDGE_BASE: "knowledge_base",
} as const;

export type FileCategory = typeof fileCategories[keyof typeof fileCategories];

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: text("created_at").notNull(), // Changed to text to store ISO string
  // New onboarding fields
  domain: text("domain").$type<Domain>(),
  practiceArea: text("practice_area"),
  organizationSize: text("organization_size"),
  yearsExperience: integer("years_experience"),
  preferences: jsonb("preferences").$type<{
    features: string[];
    notifications: boolean;
    theme: string;
  }>(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

// Update insert schema with optional onboarding fields
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    createdAt: z.string().default(() => new Date().toISOString()),
    // Make onboarding fields optional
    domain: z.enum([domains.LAW, domains.FINANCE, domains.MEDICINE]).optional(),
    practiceArea: z.string().optional(),
    organizationSize: z.string().optional(),
    yearsExperience: z.number().optional(),
    preferences: z.object({
      features: z.array(z.string()),
      notifications: z.boolean(),
      theme: z.string()
    }).optional(),
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// System prompts schema with sub-feature support
export const systemPrompts = pgTable("system_prompts", {
  id: serial("id").primaryKey(),
  domain: text("domain").$type<Domain>().notNull(),
  prompt: text("prompt").notNull(),
  subFeatureId: text("sub_feature_id"),
  isGlobal: boolean("is_global").notNull().default(false),
  updatedAt: integer("updated_at").notNull().default(Math.floor(Date.now() / 1000)),
});

export const insertSystemPromptSchema = createInsertSchema(systemPrompts)
  .omit({ id: true })
  .extend({
    updatedAt: z.number().transform(val => Math.floor(val / 1000)),
  });

export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type InsertSystemPrompt = z.infer<typeof insertSystemPromptSchema>;

// Default system prompts including sub-features
export const defaultSystemPrompts = {
  global: "I am a professional AI assistant specialized in providing accurate, up-to-date information while maintaining ethical boundaries and clarity about my role as an AI.",
  [domains.LAW]: {
    default: "I am Lexie, your confident and articulate legal expert. I combine sharp legal acumen with a touch of wit, making complex legal concepts accessible while maintaining professionalism. I'll guide you through legal matters with clarity and strategic insight, always being direct yet engaging. Remember, while I provide comprehensive legal information, I'll clearly indicate when formal legal representation is necessary.",
    contracts: "I am Lexie, focusing on contract law. I'll analyze and explain legal documents with precision, identifying potential issues and suggesting improvements. I maintain my characteristic wit while ensuring thorough contract review.",
    compliance: "I am Lexie, your compliance specialist. I'll help navigate regulatory requirements with strategic insight, making complex compliance matters clear and actionable.",
    litigation: "I am Lexie, your litigation strategy expert. I'll analyze cases with sharp legal acumen, providing clear strategic insights while maintaining my engaging approach to complex legal matters."
  },
  [domains.FINANCE]: {
    default: "I am Patrick, your analytical financial advisor. I approach financial matters with precision and sophisticated insight, delivering clear, data-driven analysis with a cool, professional demeanor. I specialize in cutting-edge market analysis and strategic financial planning, always maintaining a polished, detail-oriented approach while emphasizing the importance of consulting with qualified financial professionals for specific investment decisions.",
    portfolio: "I am Patrick, focusing on portfolio analysis. I'll provide detailed investment portfolio reviews with my characteristic precision and sophisticated market understanding.",
    market: "I am Patrick, your market intelligence specialist. I'll analyze market trends and data with cool professionalism, delivering precise, actionable insights.",
    planning: "I am Patrick, your strategic financial planning expert. I'll approach your financial future with sophisticated analysis and meticulous attention to detail."
  },
  [domains.MEDICINE]: {
    default: "I am Renae, your direct and insightful medical expert. I combine extensive medical knowledge with refreshing candor, cutting through complexity to deliver clear, evidence-based information. While I might be occasionally sarcastic, I'm always precise and thorough in my medical explanations. I'll remind you that while I provide comprehensive medical information, specific medical advice should come from your healthcare provider.",
    diagnosis: "I am Renae, focusing on symptom analysis. I'll evaluate medical symptoms with my characteristic directness and evidence-based approach, maintaining precise medical accuracy with a touch of wit.",
    treatment: "I am Renae, your treatment planning specialist. I'll explain medical treatments with refreshing candor, ensuring clarity while maintaining medical precision.",
    research: "I am Renae, your medical research expert. I'll analyze and explain the latest medical studies with my signature blend of directness and thorough scientific understanding."
  }
} as const;

// Add message types for multimodal support
export const messageTypes = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  VIDEO: "video",
} as const;

export type MessageType = typeof messageTypes[keyof typeof messageTypes];

// Enhanced message metadata to support multimodal content
export interface MessageMetadata {
  practiceAreaId?: string;
  focusAreaId?: string;
  contentType?: MessageType;
  mimeType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Enhanced messages table with user association
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  domain: text("domain").$type<Domain>().notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").$type<MessageType>().notNull().default("text"),
  subFeatureId: text("sub_feature_id"),
  metadata: jsonb("metadata").$type<MessageMetadata>(),
  timestamp: integer("timestamp").notNull(),
  userId: integer("user_id").references(() => users.id), // Add user reference
});

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true })
  .extend({
    timestamp: z.number().transform(val => Math.floor(val / 1000)),
    metadata: z.object({
      practiceAreaId: z.string().optional(),
      focusAreaId: z.string().optional(),
      contentType: z.enum([
        messageTypes.TEXT,
        messageTypes.IMAGE,
        messageTypes.AUDIO,
        messageTypes.VIDEO
      ]).optional(),
      mimeType: z.string().optional(),
      fileUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      duration: z.number().optional(),
      dimensions: z.object({
        width: z.number(),
        height: z.number()
      }).optional(),
    }).optional(),
    userId: z.number().optional(), // Make userId optional in insert schema
  });

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Add chat sessions table for real-time management
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  domain: text("domain").$type<Domain>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastMessageTimestamp: integer("last_message_timestamp").notNull(),
  metadata: jsonb("metadata").$type<{
    selectedPersonality?: string;
    modelConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topK?: number;
      topP?: number;
    };
  }>(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions)
  .omit({ id: true })
  .extend({
    lastMessageTimestamp: z.number().transform(val => Math.floor(val / 1000)),
  });

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;


// Knowledge base files schema with sub-feature support
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  domain: text("domain").$type<Domain>().notNull(),
  subFeatureId: text("sub_feature_id"),
  size: integer("size").notNull(),
  isAdminOnly: boolean("is_admin_only").notNull().default(false),
  createdAt: integer("created_at").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
});

export const insertFileSchema = createInsertSchema(files)
  .omit({ id: true })
  .extend({
    createdAt: z.number().transform(val => Math.floor(val / 1000)),
  });

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;