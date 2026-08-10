import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Interview session: Stores practice interview records with questions, answers, and feedback
 */
export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  jobDescription: text("jobDescription"),
  questions: text("questions").notNull(), // JSON array of questions
  answers: text("answers").notNull(), // JSON array of answers
  feedback: text("feedback"), // JSON object with feedback for each answer
  sessionNotes: text("sessionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = typeof interviewSessions.$inferInsert;

/**
 * Mood logs: Tracks user emotional state and context
 */
export const moodLogs = mysqlTable("mood_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodLevel: int("moodLevel").notNull(), // 1-5 scale
  moodText: varchar("moodText", { length: 100 }),
  context: varchar("context", { length: 100 }), // e.g., "before_interview", "after_rejection", "daily_check"
  situation: text("situation"), // User's description of their situation
  aiResponse: text("aiResponse"), // AI's empathetic response
  suggestedAction: varchar("suggestedAction", { length: 100 }), // e.g., "practice_interview", "consult_window", "community_activity"
  crisisFlag: int("crisisFlag").default(0), // 1 if crisis detected, 0 otherwise
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoodLog = typeof moodLogs.$inferSelect;
export type InsertMoodLog = typeof moodLogs.$inferInsert;

/**
 * Support resources: Public consultation windows and support services
 */
export const supportResources = mysqlTable("support_resources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "employment", "mental_health", "labor", "community", "reskilling"
  description: text("description"),
  targetArea: varchar("targetArea", { length: 100 }), // e.g., "Tokyo", "Chiyoda", "All"
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  businessHours: text("businessHours"),
  targetAge: varchar("targetAge", { length: 100 }), // e.g., "50+", "All"
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportResource = typeof supportResources.$inferSelect;
export type InsertSupportResource = typeof supportResources.$inferInsert;

/**
 * Learning logs: Tracks practice activities and progress
 */
export const learningLogs = mysqlTable("learning_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activityType", { length: 100 }).notNull(), // e.g., "interview_practice", "self_pr_creation", "consultation"
  activityTitle: varchar("activityTitle", { length: 255 }).notNull(),
  description: text("description"),
  completionStatus: varchar("completionStatus", { length: 50 }).default("in_progress"), // "completed", "in_progress", "abandoned"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type LearningLog = typeof learningLogs.$inferSelect;
export type InsertLearningLog = typeof learningLogs.$inferInsert;

/**
 * User profiles: Extended user information
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  targetJobTitle: varchar("targetJobTitle", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience"),
  skills: text("skills"), // JSON array
  preferredArea: varchar("preferredArea", { length: 100 }),
  prefectureCode: varchar("prefectureCode", { length: 10 }), // For resource matching
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Menstrual cycles: Tracks menstrual cycle information and symptoms
 */
export const menstrualCycles = mysqlTable("menstrual_cycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  symptoms: text("symptoms"), // JSON array of symptoms (e.g., ["cramps", "headache", "fatigue"])
  flow: varchar("flow", { length: 50 }), // "light", "moderate", "heavy"
  mood: varchar("mood", { length: 100 }), // User's mood during the period
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenstrualCycle = typeof menstrualCycles.$inferSelect;
export type InsertMenstrualCycle = typeof menstrualCycles.$inferInsert;

/**
 * Womens career support: Tracks women's career development and life-work balance
 */
export const womensCareerSupport = mysqlTable("womens_career_support", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(), // "child_rearing", "career_resume", "work_life_balance", "interview_for_mothers"
  content: text("content"), // Advice or information
  status: varchar("status", { length: 50 }).default("active"), // "active", "archived"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WomensCareerSupport = typeof womensCareerSupport.$inferSelect;
export type InsertWomensCareerSupport = typeof womensCareerSupport.$inferInsert;