import { 
  type User, 
  type InsertUser, 
  type Report, 
  type InsertReport,
  type Alert,
  type InsertAlert,
  type CarbonCredit,
  type InsertCarbonCredit,
  type CarbonTrade,
  type InsertCarbonTrade,
  type Sensor,
  type InsertSensor,
  type CoastalData,
  type AIPrediction,
  type Notification,
  type InsertNotification,
  type UserLocation,
  type InsertUserLocation,
  type Leaderboard,
  type InsertLeaderboard,
  type IotData,
  type InsertIotData,
  type GeoAnalytics,
  type InsertGeoAnalytics
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Reports
  getReports(): Promise<Report[]>;
  getReportsByUser(userId: string): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport & { userId: string }): Promise<Report>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;
  
  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  getAllAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  deactivateAlert(id: string): Promise<Alert | undefined>;
  
  // Carbon Credits
  getUserCarbonCredits(userId: string): Promise<CarbonCredit[]>;
  getUserCarbonBalance(userId: string): Promise<number>;
  addCarbonCredits(credit: InsertCarbonCredit & { userId: string }): Promise<CarbonCredit>;
  
  // Carbon Trades
  getCarbonTrades(): Promise<CarbonTrade[]>;
  createCarbonTrade(trade: InsertCarbonTrade & { sellerId: string }): Promise<CarbonTrade>;
  
  // Sensors
  getSensors(): Promise<Sensor[]>;
  getSensor(id: string): Promise<Sensor | undefined>;
  updateSensorStatus(id: string, isOnline: boolean): Promise<Sensor | undefined>;
  
  // Coastal Data
  getLatestCoastalData(): Promise<CoastalData | undefined>;
  addCoastalData(data: Omit<CoastalData, 'id' | 'timestamp'>): Promise<CoastalData>;
  
  // AI Predictions
  getLatestPredictions(): Promise<AIPrediction[]>;
  addPrediction(prediction: Omit<AIPrediction, 'id' | 'createdAt'>): Promise<AIPrediction>;
  
  // Notifications
  getNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: string, status: string): Promise<Notification | undefined>;
  
  // User Locations
  getUserLocations(userId: string): Promise<UserLocation[]>;
  getActiveUserLocation(userId: string): Promise<UserLocation | undefined>;
  createUserLocation(location: InsertUserLocation): Promise<UserLocation>;
  updateUserLocation(id: string, updates: Partial<InsertUserLocation>): Promise<UserLocation | undefined>;
  
  // Leaderboard
  getLeaderboard(): Promise<Leaderboard[]>;
  getLeaderboardByUser(userId: string): Promise<Leaderboard | undefined>;
  updateLeaderboard(userId: string, data: InsertLeaderboard): Promise<Leaderboard>;
  
  // IoT Data
  getIotData(sensorId?: string): Promise<IotData[]>;
  createIotData(data: InsertIotData): Promise<IotData>;
  
  // Geo Analytics
  getGeoAnalytics(region?: string): Promise<GeoAnalytics[]>;
  createGeoAnalytics(analytics: InsertGeoAnalytics): Promise<GeoAnalytics>;
  updateGeoAnalytics(id: string, updates: Partial<InsertGeoAnalytics>): Promise<GeoAnalytics | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private reports: Map<string, Report> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private carbonCredits: Map<string, CarbonCredit> = new Map();
  private carbonTrades: Map<string, CarbonTrade> = new Map();
  private sensors: Map<string, Sensor> = new Map();
  private coastalData: Map<string, CoastalData> = new Map();
  private aiPredictions: Map<string, AIPrediction> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private userLocations: Map<string, UserLocation> = new Map();
  private leaderboard: Map<string, Leaderboard> = new Map();
  private iotData: Map<string, IotData> = new Map();
  private geoAnalytics: Map<string, GeoAnalytics> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize sensors
    const sensorData: Omit<Sensor, 'id'>[] = [
      { name: "Alpha-1", type: "wave", location: "North Bay", latitude: 40.7128, longitude: -74.0060, isOnline: true, lastReading: new Date() },
      { name: "Beta-3", type: "tide", location: "Central Pier", latitude: 40.7589, longitude: -73.9851, isOnline: false, lastReading: new Date() },
      { name: "Gamma-2", type: "weather", location: "South Beach", latitude: 40.6892, longitude: -74.0445, isOnline: true, lastReading: new Date() },
    ];

    sensorData.forEach(sensor => {
      const id = randomUUID();
      this.sensors.set(id, { ...sensor, id });
    });

    // Initialize latest coastal data
    const coastalId = randomUUID();
    this.coastalData.set(coastalId, {
      id: coastalId,
      waveHeight: 2.1,
      tideLevel: 1.8,
      windSpeed: 15,
      temperature: 22,
      timestamp: new Date()
    });

    // Initialize AI predictions
    const predictions = [
      { timeSlot: "6-12", riskLevel: "low", confidence: 85, factors: { tide: "normal", weather: "stable" } },
      { timeSlot: "12-18", riskLevel: "medium", confidence: 78, factors: { tide: "high", weather: "changing" } },
      { timeSlot: "18-24", riskLevel: "low", confidence: 92, factors: { tide: "normal", weather: "stable" } },
    ];

    predictions.forEach(pred => {
      const id = randomUUID();
      this.aiPredictions.set(id, { ...pred, id, createdAt: new Date() });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role || "community"
    };
    this.users.set(id, user);
    return user;
  }

  // Reports
  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(report: InsertReport & { userId: string }): Promise<Report> {
    const id = randomUUID();
    const newReport: Report = { 
      ...report, 
      id, 
      createdAt: new Date(),
      status: report.status || "pending",
      priority: report.priority || "medium",
      latitude: report.latitude || null,
      longitude: report.longitude || null,
      photos: report.photos || null
    };
    this.reports.set(id, newReport);
    
    // Award carbon credits for reporting
    await this.addCarbonCredits({
      userId: report.userId,
      amount: 5,
      source: "reporting",
      description: `Earned for reporting: ${report.title}`
    });
    
    return newReport;
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (report) {
      const updated = { ...report, status };
      this.reports.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.isActive)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = { 
      ...alert, 
      id, 
      createdAt: new Date(),
      isActive: alert.isActive !== undefined ? alert.isActive : true,
      expiresAt: alert.expiresAt || null
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async deactivateAlert(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      const updated = { ...alert, isActive: false };
      this.alerts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Carbon Credits
  async getUserCarbonCredits(userId: string): Promise<CarbonCredit[]> {
    return Array.from(this.carbonCredits.values())
      .filter(credit => credit.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getUserCarbonBalance(userId: string): Promise<number> {
    const credits = await this.getUserCarbonCredits(userId);
    return credits.reduce((total, credit) => total + credit.amount, 0);
  }

  async addCarbonCredits(credit: InsertCarbonCredit & { userId: string }): Promise<CarbonCredit> {
    const id = randomUUID();
    const newCredit: CarbonCredit = { ...credit, id, createdAt: new Date() };
    this.carbonCredits.set(id, newCredit);
    return newCredit;
  }

  // Carbon Trades
  async getCarbonTrades(): Promise<CarbonTrade[]> {
    return Array.from(this.carbonTrades.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createCarbonTrade(trade: InsertCarbonTrade & { sellerId: string }): Promise<CarbonTrade> {
    const id = randomUUID();
    const newTrade: CarbonTrade = { 
      ...trade, 
      id, 
      createdAt: new Date(),
      status: trade.status || "pending"
    };
    this.carbonTrades.set(id, newTrade);
    return newTrade;
  }

  // Sensors
  async getSensors(): Promise<Sensor[]> {
    return Array.from(this.sensors.values());
  }

  async getSensor(id: string): Promise<Sensor | undefined> {
    return this.sensors.get(id);
  }

  async updateSensorStatus(id: string, isOnline: boolean): Promise<Sensor | undefined> {
    const sensor = this.sensors.get(id);
    if (sensor) {
      const updated = { ...sensor, isOnline, lastReading: new Date() };
      this.sensors.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Coastal Data
  async getLatestCoastalData(): Promise<CoastalData | undefined> {
    const data = Array.from(this.coastalData.values());
    return data.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())[0];
  }

  async addCoastalData(data: Omit<CoastalData, 'id' | 'timestamp'>): Promise<CoastalData> {
    const id = randomUUID();
    const newData: CoastalData = { ...data, id, timestamp: new Date() };
    this.coastalData.set(id, newData);
    return newData;
  }

  // AI Predictions
  async getLatestPredictions(): Promise<AIPrediction[]> {
    return Array.from(this.aiPredictions.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 3);
  }

  async addPrediction(prediction: Omit<AIPrediction, 'id' | 'createdAt'>): Promise<AIPrediction> {
    const id = randomUUID();
    const newPrediction: AIPrediction = { ...prediction, id, createdAt: new Date() };
    this.aiPredictions.set(id, newPrediction);
    return newPrediction;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = { ...notification, id, createdAt: new Date() };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async updateNotificationStatus(id: string, status: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (notification) {
      const updated = { ...notification, status };
      this.notifications.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // User Locations
  async getUserLocations(userId: string): Promise<UserLocation[]> {
    return Array.from(this.userLocations.values())
      .filter(location => location.userId === userId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async getActiveUserLocation(userId: string): Promise<UserLocation | undefined> {
    return Array.from(this.userLocations.values())
      .find(location => location.userId === userId && location.isActive);
  }

  async createUserLocation(location: InsertUserLocation): Promise<UserLocation> {
    const id = randomUUID();
    const newLocation: UserLocation = { ...location, id, timestamp: new Date() };
    
    // Deactivate other locations for this user
    Array.from(this.userLocations.values())
      .filter(loc => loc.userId === location.userId && loc.isActive)
      .forEach(loc => {
        this.userLocations.set(loc.id, { ...loc, isActive: false });
      });
    
    this.userLocations.set(id, newLocation);
    return newLocation;
  }

  async updateUserLocation(id: string, updates: Partial<InsertUserLocation>): Promise<UserLocation | undefined> {
    const location = this.userLocations.get(id);
    if (location) {
      const updated = { ...location, ...updates };
      this.userLocations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Leaderboard
  async getLeaderboard(): Promise<Leaderboard[]> {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => (b.totalCredits || 0) - (a.totalCredits || 0));
  }

  async getLeaderboardByUser(userId: string): Promise<Leaderboard | undefined> {
    return this.leaderboard.get(userId);
  }

  async updateLeaderboard(userId: string, data: InsertLeaderboard): Promise<Leaderboard> {
    const existing = this.leaderboard.get(userId);
    const updated: Leaderboard = {
      ...existing,
      ...data,
      id: existing?.id || randomUUID(),
      userId,
      lastUpdated: new Date()
    };
    this.leaderboard.set(userId, updated);
    return updated;
  }

  // IoT Data
  async getIotData(sensorId?: string): Promise<IotData[]> {
    const data = Array.from(this.iotData.values());
    if (sensorId) {
      return data.filter(d => d.sensorId === sensorId)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    }
    return data.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createIotData(data: InsertIotData): Promise<IotData> {
    const id = randomUUID();
    const newData: IotData = { ...data, id, timestamp: new Date() };
    this.iotData.set(id, newData);
    return newData;
  }

  // Geo Analytics
  async getGeoAnalytics(region?: string): Promise<GeoAnalytics[]> {
    const analytics = Array.from(this.geoAnalytics.values());
    if (region) {
      return analytics.filter(a => a.region.toLowerCase().includes(region.toLowerCase()))
        .sort((a, b) => new Date(b.lastAnalysis!).getTime() - new Date(a.lastAnalysis!).getTime());
    }
    return analytics.sort((a, b) => new Date(b.lastAnalysis!).getTime() - new Date(a.lastAnalysis!).getTime());
  }

  async createGeoAnalytics(analytics: InsertGeoAnalytics): Promise<GeoAnalytics> {
    const id = randomUUID();
    const newAnalytics: GeoAnalytics = { ...analytics, id, lastAnalysis: new Date() };
    this.geoAnalytics.set(id, newAnalytics);
    return newAnalytics;
  }

  async updateGeoAnalytics(id: string, updates: Partial<InsertGeoAnalytics>): Promise<GeoAnalytics | undefined> {
    const analytics = this.geoAnalytics.get(id);
    if (analytics) {
      const updated = { ...analytics, ...updates, lastAnalysis: new Date() };
      this.geoAnalytics.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
