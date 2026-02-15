import type { NextFunction, Response } from "express";
import { verifyToken } from "./auth.js";
import type { AuthRequest } from "./types.js";

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.user_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.role !== "user") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function noIndexAdmin(_req: AuthRequest, res: Response, next: NextFunction) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  return next();
}
