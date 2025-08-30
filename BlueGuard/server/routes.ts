import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertReportSchema, insertAlertSchema, insertCarbonTradeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // Dashboard data
  app.get("/api/dashboard/coastal-data", async (req, res) => {
    try {
      const data = await storage.getLatestCoastalData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coastal data", error });
    }
  });

  app.get("/api/dashboard/predictions", async (req, res) => {
    try {
      const predictions = await storage.getLatestPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch predictions", error });
    }
  });

  app.get("/api/dashboard/sensors", async (req, res) => {
    try {
      const sensors = await storage.getSensors();
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sensors", error });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts", error });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Invalid alert data", error });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const { userId } = req.query;
      let reports;
      
      if (userId) {
        reports = await storage.getReportsByUser(userId as string);
      } else {
        reports = await storage.getReports();
      }
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports", error });
    }
  });

  app.post("/api/reports", upload.array('photos', 5), async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Handle uploaded photos
      const photos = (req.files as any[])?.map((file: any) => file.filename) || [];
      
      const report = await storage.createReport({
        ...reportData,
        userId,
        photos
      });
      
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid report data", error });
    }
  });

  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const report = await storage.updateReportStatus(id, status);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report status", error });
    }
  });

  // Carbon Credits
  app.get("/api/carbon-credits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const credits = await storage.getUserCarbonCredits(userId);
      const balance = await storage.getUserCarbonBalance(userId);
      
      res.json({ credits, balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch carbon credits", error });
    }
  });

  app.get("/api/carbon-credits/trades", async (req, res) => {
    try {
      const trades = await storage.getCarbonTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch carbon trades", error });
    }
  });

  app.post("/api/carbon-credits/trade", async (req, res) => {
    try {
      const tradeData = insertCarbonTradeSchema.parse(req.body);
      const { sellerId } = req.body;
      
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }
      
      const trade = await storage.createCarbonTrade({
        ...tradeData,
        sellerId
      });
      
      res.json(trade);
    } catch (error) {
      res.status(400).json({ message: "Invalid trade data", error });
    }
  });

  // Authority routes
  app.get("/api/authority/stats", async (req, res) => {
    try {
      const reports = await storage.getReports();
      const alerts = await storage.getActiveAlerts();
      const sensors = await storage.getSensors();
      
      const stats = {
        pendingReports: reports.filter(r => r.status === 'pending').length,
        activeAlerts: alerts.length,
        sensorsOnline: sensors.filter(s => s.isOnline).length,
        totalSensors: sensors.length,
        priorityReports: reports.filter(r => r.priority === 'high' && r.status === 'pending')
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authority stats", error });
    }
  });

  // Real-time data simulation
  app.post("/api/simulate/coastal-data", async (req, res) => {
    try {
      // Simulate new coastal data with small variations
      const baseData = await storage.getLatestCoastalData();
      const newData = {
        waveHeight: (baseData?.waveHeight || 2.1) + (Math.random() - 0.5) * 0.4,
        tideLevel: (baseData?.tideLevel || 1.8) + (Math.random() - 0.5) * 0.3,
        windSpeed: (baseData?.windSpeed || 15) + (Math.random() - 0.5) * 5,
        temperature: (baseData?.temperature || 22) + (Math.random() - 0.5) * 2,
      };
      
      const savedData = await storage.addCoastalData(newData);
      res.json(savedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate coastal data", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
