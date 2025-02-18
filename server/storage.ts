import { db } from "./db";
import { eq } from "drizzle-orm";
import { messages, systemPrompts, files, users, defaultSystemPrompts, type Message, type InsertMessage, type SystemPrompt, type InsertSystemPrompt, type Domain, type File, type InsertFile, type User, type InsertUser } from "@shared/schema";
import * as fs from 'fs';
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Message operations
  getMessages(threadId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // System prompt operations
  getSystemPrompt(domain: Domain): Promise<string>;
  getGlobalSystemPrompt(): Promise<string>;
  updateSystemPrompt(prompt: InsertSystemPrompt): Promise<SystemPrompt>;

  // File operations
  getFiles(domain: Domain, includeAdminOnly?: boolean): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
      tableName: 'session',
      ttl: 86400, // 1 day
      pruneSessionInterval: 60 // 1 minute
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      passwordHash: insertUser.passwordHash,
      isAdmin: insertUser.isAdmin ?? false,
      createdAt: insertUser.createdAt,
      preferences: insertUser.preferences,
      domain: insertUser.domain,
      practiceArea: insertUser.practiceArea,
      organizationSize: insertUser.organizationSize,
      yearsExperience: insertUser.yearsExperience,
      onboardingCompleted: insertUser.onboardingCompleted ?? false
    }).returning();
    return user;
  }

  // Message operations
  async getMessages(threadId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.threadId, threadId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      threadId: insertMessage.threadId,
      domain: insertMessage.domain,
      role: insertMessage.role,
      content: insertMessage.content,
      contentType: insertMessage.contentType ?? "text",
      subFeatureId: insertMessage.subFeatureId,
      metadata: insertMessage.metadata,
      timestamp: insertMessage.timestamp,
      userId: insertMessage.userId
    }).returning();
    return message;
  }

  // System prompt operations
  async getSystemPrompt(domain: Domain): Promise<string> {
    const [prompt] = await db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.domain, domain));

    if (prompt) {
      return prompt.prompt;
    }

    // Return the default prompt if no custom prompt exists
    return defaultSystemPrompts.global;
  }

  async getGlobalSystemPrompt(): Promise<string> {
    return defaultSystemPrompts.global;
  }

  async updateSystemPrompt(prompt: InsertSystemPrompt): Promise<SystemPrompt> {
    const insertPrompt = {
      domain: prompt.domain,
      prompt: prompt.prompt,
      subFeatureId: prompt.subFeatureId,
      isGlobal: prompt.isGlobal ?? false,
      updatedAt: Math.floor(Date.now() / 1000),
    };

    // Ensure database record exists
    const [existingPrompt] = await db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.domain, prompt.domain));

    // Also persist to filesystem as backup
    const promptsDir = 'data/prompts';
    await fs.promises.mkdir(promptsDir, { recursive: true });
    await fs.promises.writeFile(
      `${promptsDir}/${prompt.domain}.txt`,
      prompt.prompt,
      'utf-8'
    );

    if (existingPrompt) {
      const [updatedPrompt] = await db
        .update(systemPrompts)
        .set(insertPrompt)
        .where(eq(systemPrompts.id, existingPrompt.id))
        .returning();
      return updatedPrompt;
    }

    const [newPrompt] = await db
      .insert(systemPrompts)
      .values(insertPrompt)
      .returning();
    return newPrompt;
  }

  // File operations
  async getFiles(domain: Domain, includeAdminOnly: boolean = false): Promise<File[]> {
    const query = db
      .select()
      .from(files)
      .where(eq(files.domain, domain));

    return await query;
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values({
      name: insertFile.name,
      content: insertFile.content,
      fileType: insertFile.fileType,
      domain: insertFile.domain,
      subFeatureId: insertFile.subFeatureId,
      size: insertFile.size,
      isAdminOnly: insertFile.isAdminOnly ?? false,
      createdAt: insertFile.createdAt,
      uploadedBy: insertFile.uploadedBy
    }).returning();
    return file;
  }
}

export const storage = new DatabaseStorage();