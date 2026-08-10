import { eq, gte, lte, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  interviewSessions,
  moodLogs,
  supportResources,
  learningLogs,
  userProfiles,
  InsertUserProfile,
  menstrualCycles,
  InsertMenstrualCycle,
  womensCareerSupport,
  InsertWomensCareerSupport,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Interview session queries
 */
export async function createInterviewSession(
  userId: number,
  jobTitle: string,
  jobDescription: string | null,
  questions: string,
  answers: string,
  feedback: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewSessions).values({
    userId,
    jobTitle,
    jobDescription,
    questions,
    answers,
    feedback,
  });
  
  return result;
}

export async function getInterviewSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(interviewSessions.createdAt);
}

export async function getInterviewSessionById(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(interviewSessions)
    .where(
      eq(interviewSessions.id, sessionId) &&
      eq(interviewSessions.userId, userId)
    )
    .limit(1);
  
  return result[0];
}

/**
 * Mood log queries
 */
export async function createMoodLog(
  userId: number,
  moodLevel: number,
  moodText: string | null,
  context: string | null,
  situation: string | null,
  aiResponse: string | null,
  suggestedAction: string | null,
  crisisFlag: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(moodLogs).values({
    userId,
    moodLevel,
    moodText,
    context,
    situation,
    aiResponse,
    suggestedAction,
    crisisFlag,
  });
}

export async function getMoodLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(moodLogs)
    .where(eq(moodLogs.userId, userId))
    .orderBy(moodLogs.createdAt);
}

export async function getMoodLogsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(moodLogs)
    .where(
      eq(moodLogs.userId, userId) &&
      gte(moodLogs.createdAt, startDate) &&
      lte(moodLogs.createdAt, endDate)
    )
    .orderBy(moodLogs.createdAt);
}

/**
 * Support resource queries
 */
export async function getSupportResources(category?: string, targetArea?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (category) conditions.push(eq(supportResources.category, category));
  if (targetArea) conditions.push(eq(supportResources.targetArea, targetArea));
  
  if (conditions.length > 0) {
    return await db.select().from(supportResources).where(and(...conditions));
  }
  
  return await db.select().from(supportResources);
}

export async function createSupportResource(
  name: string,
  category: string,
  targetArea: string,
  description?: string,
  address?: string,
  phone?: string,
  email?: string,
  website?: string,
  businessHours?: string,
  targetAge?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(supportResources).values({
    name,
    category,
    description,
    targetArea,
    address,
    phone,
    email,
    website,
    businessHours,
    targetAge,
    lastVerifiedAt: new Date(),
  });
}

/**
 * Learning log queries
 */
export async function createLearningLog(
  userId: number,
  activityType: string,
  activityTitle: string,
  description?: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(learningLogs).values({
    userId,
    activityType,
    activityTitle,
    description,
    notes,
  });
}

export async function getLearningLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(learningLogs)
    .where(eq(learningLogs.userId, userId))
    .orderBy(learningLogs.createdAt);
}

export async function completeLearningLog(logId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(learningLogs)
    .set({
      completionStatus: "completed",
      completedAt: new Date(),
    })
    .where(eq(learningLogs.id, logId));
}

/**
 * User profile queries
 */
export async function createUserProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(userProfiles).values({ userId });
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertUserProfile>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.userId, userId));
}

/**
 * Menstrual cycle queries
 */
export async function createMenstrualCycle(
  userId: number,
  startDate: Date,
  endDate: Date | null,
  symptoms: string[] | null,
  flow: string | null,
  mood: string | null,
  notes: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(menstrualCycles).values({
    userId,
    startDate,
    endDate,
    symptoms: symptoms ? JSON.stringify(symptoms) : null,
    flow,
    mood,
    notes,
  });
}

export async function getMenstrualCycles(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(menstrualCycles)
    .where(eq(menstrualCycles.userId, userId))
    .orderBy(menstrualCycles.startDate);
}

export async function getMenstrualCycleById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(menstrualCycles)
    .where(
      eq(menstrualCycles.id, id) &&
      eq(menstrualCycles.userId, userId)
    )
    .limit(1);
  
  return result[0];
}

export async function updateMenstrualCycle(
  id: number,
  userId: number,
  updates: Partial<InsertMenstrualCycle>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(menstrualCycles)
    .set(updates)
    .where(
      eq(menstrualCycles.id, id) &&
      eq(menstrualCycles.userId, userId)
    );
}

export async function deleteMenstrualCycle(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(menstrualCycles)
    .where(
      eq(menstrualCycles.id, id) &&
      eq(menstrualCycles.userId, userId)
    );
}

/**
 * Womens career support queries
 */
export async function createWomensCareerSupport(
  userId: number,
  category: string,
  content: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(womensCareerSupport).values({
    userId,
    category,
    content,
  });
}

export async function getWomensCareerSupport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(womensCareerSupport)
    .where(
      eq(womensCareerSupport.userId, userId) &&
      eq(womensCareerSupport.status, "active")
    )
    .orderBy(womensCareerSupport.createdAt);
}

export async function getWomensCareersupportByCategory(userId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(womensCareerSupport)
    .where(
      eq(womensCareerSupport.userId, userId) &&
      eq(womensCareerSupport.category, category) &&
      eq(womensCareerSupport.status, "active")
    );
}
