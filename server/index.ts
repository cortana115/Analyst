import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import path from 'path';
import { WebSocketServer } from 'ws';
import { parse } from 'cookie';
import { storage } from "./storage";
import { type Domain } from "@shared/schema";

// Store connected clients
const connectedClients = new Map<string, {
  ws: WebSocket;
  threadId: string;
  userId: string;
  domain: Domain;
}>();

const app = express();
// Increase body size limit to 10MB for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Set up authentication first
    setupAuth(app);

    // Then register API routes and get the HTTP server
    const server = registerRoutes(app);

    // Set up WebSocket server with session support
    const wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: async (info, done) => {
        try {
          const cookies = parse(info.req.headers.cookie || '');
          const sid = cookies['connect.sid'];

          if (!sid) {
            done(false, 401, 'Unauthorized');
            return;
          }

          const sessionID = sid.split('.')[0].slice(2);

          // Verify session exists
          const session = await new Promise((resolve) => {
            storage.sessionStore.get(sessionID, (err, session) => {
              resolve(session);
            });
          });

          if (!session) {
            done(false, 401, 'Invalid session');
            return;
          }

          // Attach session to websocket for later use
          (info.req as any).session = session;
          done(true);
        } catch (error) {
          console.error('WebSocket auth error:', error);
          done(false, 500, 'Internal server error');
        }
      }
    });

    // Broadcast to all clients in the same thread
    function broadcastToThread(threadId: string, message: any) {
      Array.from(connectedClients.values()).forEach(client => {
        if (client.threadId === threadId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      });
    }

    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          const session = (req as any).session;

          switch (message.type) {
            case 'join':
              connectedClients.set(message.userId, {
                ws,
                threadId: message.threadId,
                userId: message.userId,
                domain: message.domain
              });
              broadcastToThread(message.threadId, {
                type: 'user_joined',
                userId: message.userId,
                timestamp: Date.now()
              });
              break;

            case 'typing':
              broadcastToThread(message.threadId, {
                type: 'typing',
                userId: message.userId,
                isTyping: message.isTyping
              });
              break;

            case 'leave':
              connectedClients.delete(message.userId);
              broadcastToThread(message.threadId, {
                type: 'user_left',
                userId: message.userId,
                timestamp: Date.now()
              });
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        // Find and remove the disconnected client
        Array.from(connectedClients.entries()).forEach(([userId, client]) => {
          if (client.ws === ws) {
            connectedClients.delete(userId);
            broadcastToThread(client.threadId, {
              type: 'user_left',
              userId,
              timestamp: Date.now()
            });
          }
        });
      });

      ws.on('error', console.error);
      ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    });

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${err.message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const tryPort = async (port: number): Promise<number> => {
      try {
        await new Promise((resolve, reject) => {
          server.listen(port, "0.0.0.0")
            .once('listening', () => {
              server.close();
              resolve(port);
            })
            .once('error', reject);
        });
        return port;
      } catch {
        return tryPort(port + 1);
      }
    };

    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : await tryPort(5000);
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();