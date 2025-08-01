import type { Express, Request } from "express";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, insertUserSchema, loginSchema, insertDopeCardSchema, insertDopeRangeSchema, type User } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Extend Express Request type to include user session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: any, next: any) => {
  console.log("Auth check - Session:", req.session.userId, "Cookie:", req.headers.cookie);
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const requireAdmin = (req: Request, res: any, next: any) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with database store
  const pgSession = connectPgSimple(session);
  app.use(session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await storage.verifyPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        res.status(400).json({ message: "Email already exists" });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Get all sessions with optional filtering
  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const { name, dateFrom, dateTo, rifle, distance } = req.query;
      
      const filters = {
        name: name as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        rifle: rifle as string,
        distance: distance ? parseInt(distance as string) : undefined,
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
      );
      
      const sessions = Object.keys(filters).length > 0 
        ? await storage.getFilteredSessions(filters, req.session.userId!)
        : await storage.getSessions(req.session.userId!);
        
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Get single session
  app.get("/api/sessions/:id", requireAuth, async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id, req.session.userId!);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  
  // Create new session
  app.post("/api/sessions", requireAuth, async (req, res) => {
    // Conditionally apply multer based on content type
    const isFormData = req.get('content-type')?.includes('multipart/form-data');
    console.log("Content-Type:", req.get('content-type'));
    console.log("Is form data:", isFormData);
    
    if (isFormData) {
      // Handle multipart form data with photo
      upload.single('photo')(req, res, async (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ message: "File upload error" });
        }
        console.log("=== MULTER DEBUG ===");
        console.log("req.body:", JSON.stringify(req.body, null, 2));
        console.log("req.body keys:", Object.keys(req.body || {}));
        console.log("req.file:", req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          filename: req.file.filename
        } : "No file");
        console.log("===================");
        await handleSessionCreation(req, res, true);
      });
    } else {
      // Handle JSON data without photo
      await handleSessionCreation(req, res, false);
    }
  });

  async function handleSessionCreation(req: any, res: any, hasPhoto: boolean) {
    try {
      // Handle both form-data (with photo) and JSON requests
      let sessionData;
      if (hasPhoto) {
        // Form data request with photo
        console.log("Available form fields:", Object.keys(req.body || {}));
        
        if (req.body && req.body.sessionData) {
          try {
            sessionData = JSON.parse(req.body.sessionData);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            throw new Error("Invalid session data format");
          }
        } else {
          throw new Error("Session data missing from form upload");
        }
      } else {
        // Direct JSON request without photo
        sessionData = req.body;
      }
      
      // Debug log to see what we received
      console.log("Has photo:", hasPhoto);
      console.log("Raw req.body:", req.body);
      console.log("req.body.sessionData:", req.body.sessionData);
      console.log("Parsed sessionData:", sessionData);
      
      // Validate session data
      const validatedData = insertSessionSchema.parse(sessionData);
      
      // Handle photo upload
      let photoUrl = null;
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const session = await storage.createSession({
        ...validatedData,
        photoUrl,
      }, req.session.userId!);
      
      res.status(201).json(session);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (hasPhoto && req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (error instanceof Error) {
        console.error("Session creation error:", error);
        res.status(400).json({ message: error.message });
      } else {
        console.error("Unknown session creation error:", error);
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  }
  
  // Update session
  app.put("/api/sessions/:id", requireAuth, async (req, res) => {
    // Handle both FormData (with photo) and JSON requests  
    const isFormData = req.get('content-type')?.includes('multipart/form-data');
    
    if (isFormData) {
      // Handle multipart form data with photo
      upload.single('photo')(req, res, async (err) => {
        if (err) {
          console.error("Multer error on update:", err);
          return res.status(400).json({ message: "File upload error" });
        }
        await handleSessionUpdate(req, res, true);
      });
    } else {
      // Handle JSON data without photo
      await handleSessionUpdate(req, res, false);
    }
  });

  async function handleSessionUpdate(req: any, res: any, hasPhoto: boolean) {
    try {
      let sessionData;
      if (hasPhoto && req.body.sessionData) {
        sessionData = JSON.parse(req.body.sessionData);
      } else {
        sessionData = req.body;
      }
      
      const validatedData = insertSessionSchema.partial().parse(sessionData);
      
      // Handle photo upload
      if (hasPhoto && req.file) {
        validatedData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const session = await storage.updateSession(req.params.id, validatedData, req.session.userId!);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (hasPhoto && req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (error instanceof Error) {
        console.error("Session update error:", error);
        res.status(400).json({ message: error.message });
      } else {
        console.error("Unknown session update error:", error);
        res.status(500).json({ message: "Failed to update session" });
      }
    }
  }
  
  // Delete session
  app.delete("/api/sessions/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // DOPE Card routes
  app.get("/api/dope-cards", requireAuth, async (req, res) => {
    try {
      const dopeCards = await storage.getDopeCards(req.session.userId!);
      res.json(dopeCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DOPE cards" });
    }
  });

  app.post("/api/dope-cards", requireAuth, async (req, res) => {
    try {
      const dopeCardData = insertDopeCardSchema.parse(req.body);
      const dopeCard = await storage.createDopeCard(dopeCardData, req.session.userId!);
      res.status(201).json(dopeCard);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create DOPE card" });
      }
    }
  });

  app.put("/api/dope-cards/:id", requireAuth, async (req, res) => {
    try {
      const dopeCardData = insertDopeCardSchema.partial().parse(req.body);
      const dopeCard = await storage.updateDopeCard(req.params.id, dopeCardData, req.session.userId!);
      if (!dopeCard) {
        return res.status(404).json({ message: "DOPE card not found" });
      }
      res.json(dopeCard);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to update DOPE card" });
      }
    }
  });

  app.delete("/api/dope-cards/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteDopeCard(req.params.id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "DOPE card not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete DOPE card" });
    }
  });

  // DOPE Range routes
  app.get("/api/dope-cards/:cardId/ranges", requireAuth, async (req, res) => {
    try {
      const ranges = await storage.getDopeRanges(req.params.cardId);
      res.json(ranges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DOPE ranges" });
    }
  });

  app.post("/api/dope-cards/:cardId/ranges", requireAuth, async (req, res) => {
    try {
      const rangeData = insertDopeRangeSchema.parse(req.body);
      const range = await storage.createDopeRange(rangeData, req.params.cardId);
      res.status(201).json(range);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create DOPE range" });
      }
    }
  });

  app.put("/api/dope-ranges/:id", requireAuth, async (req, res) => {
    try {
      const rangeData = insertDopeRangeSchema.partial().parse(req.body);
      const range = await storage.updateDopeRange(req.params.id, rangeData);
      if (!range) {
        return res.status(404).json({ message: "DOPE range not found" });
      }
      res.json(range);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to update DOPE range" });
      }
    }
  });

  app.delete("/api/dope-ranges/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteDopeRange(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "DOPE range not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete DOPE range" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
