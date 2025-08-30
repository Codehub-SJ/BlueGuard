import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("community"), // 'community' | 'authority'
  createdAt: timestamp("created_at").defaultNow(),
});

export const coastalData = pgTable("coastal_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  waveHeight: real("wave_height").notNull(),
  tideLevel: real("tide_level").notNull(),
  windSpeed: real("wind_speed").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity"),
  pressure: real("pressure"),
  visibility: real("visibility"),
  uvIndex: real("uv_index"),
  location: text("location").default("default"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'erosion' | 'flooding' | 'illegal_mining' | 'hazard' | 'other'
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  photos: text("photos").array(),
  priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high'
  status: text("status").notNull().default("pending"), // 'pending' | 'reviewed' | 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'warning' | 'watch' | 'emergency'
  title: text("title").notNull(),
  message: text("message").notNull(),
  riskLevel: text("risk_level").notNull(), // 'low' | 'medium' | 'high'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const carbonCredits = pgTable("carbon_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(), // 'conservation' | 'reporting' | 'trade'
  description: text("description").notNull(),
  blockchainHash: text("blockchain_hash"),
  verified: boolean("verified").default(false),
  verificationTimestamp: timestamp("verification_timestamp"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carbonTrades = pgTable("carbon_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  buyerCompany: text("buyer_company").notNull(),
  amount: integer("amount").notNull(),
  pricePerCredit: real("price_per_credit").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

export const sensors = pgTable("sensors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'wave' | 'tide' | 'weather' | 'seismic'
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  isOnline: boolean("is_online").notNull().default(true),
  lastReading: timestamp("last_reading").defaultNow(),
});

export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timeSlot: text("time_slot").notNull(), // '6-12', '12-18', '18-24'
  riskLevel: text("risk_level").notNull(), // 'low' | 'medium' | 'high'
  confidence: integer("confidence").notNull(), // 0-100
  factors: jsonb("factors"), // JSON object with contributing factors
  mlModelVersion: text("ml_model_version").default("v1.0"),
  location: text("location").default("default"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertCarbonCreditSchema = createInsertSchema(carbonCredits).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertCarbonTradeSchema = createInsertSchema(carbonTrades).omit({
  id: true,
  sellerId: true,
  createdAt: true,
});

export const insertSensorSchema = createInsertSchema(sensors).omit({
  id: true,
});

// New tables for advanced features
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // 'sms' | 'email' | 'push'
  recipient: text("recipient").notNull(), // phone number or email
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'failed'
  alertId: varchar("alert_id").references(() => alerts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLocations = pgTable("user_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalCredits: integer("total_credits").default(0),
  rank: integer("rank"),
  achievements: text("achievements").array(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const iotData = pgTable("iot_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sensorId: varchar("sensor_id").references(() => sensors.id).notNull(),
  readings: jsonb("readings").notNull(), // Flexible JSON for different sensor types
  quality: text("quality").default("good"), // 'excellent' | 'good' | 'fair' | 'poor'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const geoAnalytics = pgTable("geo_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  riskZone: text("risk_zone").notNull(), // 'high' | 'medium' | 'low'
  activityLevel: integer("activity_level").default(0), // 0-100
  clusterSize: integer("cluster_size").default(1),
  incidentCount: integer("incident_count").default(0),
  lastAnalysis: timestamp("last_analysis").defaultNow(),
});

// Insert schemas for new tables
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({
  id: true,
  timestamp: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  lastUpdated: true,
});

export const insertIotDataSchema = createInsertSchema(iotData).omit({
  id: true,
  timestamp: true,
});

export const insertGeoAnalyticsSchema = createInsertSchema(geoAnalytics).omit({
  id: true,
  lastAnalysis: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export type InsertCarbonCredit = z.infer<typeof insertCarbonCreditSchema>;
export type CarbonCredit = typeof carbonCredits.$inferSelect;

export type InsertCarbonTrade = z.infer<typeof insertCarbonTradeSchema>;
export type CarbonTrade = typeof carbonTrades.$inferSelect;

export type InsertSensor = z.infer<typeof insertSensorSchema>;
export type Sensor = typeof sensors.$inferSelect;

export type CoastalData = typeof coastalData.$inferSelect;
export type AIPrediction = typeof aiPredictions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;
export type UserLocation = typeof userLocations.$inferSelect;

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;

export type InsertIotData = z.infer<typeof insertIotDataSchema>;
export type IotData = typeof iotData.$inferSelect;

export type InsertGeoAnalytics = z.infer<typeof insertGeoAnalyticsSchema>;
export type GeoAnalytics = typeof geoAnalytics.$inferSelect;
