import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema } from "@shared/schema";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  
  // Get all sessions with optional filtering
  app.get("/api/sessions", async (req, res) => {
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
        ? await storage.getFilteredSessions(filters)
        : await storage.getSessions();
        
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Get single session
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  
  // Create new session
  app.post("/api/sessions", upload.single('photo'), async (req, res) => {
    try {
      const sessionData = JSON.parse(req.body.sessionData || '{}');
      
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
      });
      
      res.status(201).json(session);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });
  
  // Update session
  app.put("/api/sessions/:id", upload.single('photo'), async (req, res) => {
    try {
      const sessionData = JSON.parse(req.body.sessionData || '{}');
      const validatedData = insertSessionSchema.partial().parse(sessionData);
      
      // Handle photo upload
      if (req.file) {
        validatedData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const session = await storage.updateSession(req.params.id, validatedData);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update session" });
      }
    }
  });
  
  // Delete session
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
