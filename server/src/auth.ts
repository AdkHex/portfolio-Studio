import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { config } from "./config.js";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  scope?: "admin" | "user";
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie("admin_token", { path: "/" });
}

export function setUserAuthCookie(res: Response, token: string) {
  res.cookie("user_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

export function clearUserAuthCookie(res: Response) {
  res.clearCookie("user_token", { path: "/" });
}
