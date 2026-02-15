import type { Request } from "express";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    role: string;
    scope?: "admin" | "user";
  };
}
