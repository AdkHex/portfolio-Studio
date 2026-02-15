import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword, signToken, verifyToken } from "./auth.js";

describe("auth helpers", () => {
  it("hashes and verifies password", async () => {
    const hash = await hashPassword("StrongPass123!");
    const ok = await comparePassword("StrongPass123!", hash);
    expect(ok).toBe(true);
  });

  it("signs and verifies token", () => {
    const token = signToken({ userId: "u1", email: "a@b.com", role: "admin" });
    const payload = verifyToken(token);
    expect(payload.userId).toBe("u1");
    expect(payload.role).toBe("admin");
  });
});
