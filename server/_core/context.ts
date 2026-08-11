import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

const DEV_MODE =
  process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

const DEV_USER: User = {
  id: 1,
  openId: "dev-guest-user",
  name: "ゲストユーザー",
  email: "guest@example.com",
  loginMethod: "development",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Keep the server in sync with the client's local-only dummy login.
  // Production still requires a valid OAuth session.
  if (!user && DEV_MODE) {
    user = DEV_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
