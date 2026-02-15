import { describe, expect, it } from "vitest";
import { loginSchema, messageSchema } from "./validators.js";

describe("validators", () => {
  it("validates login payload", () => {
    const result = loginSchema.safeParse({ email: "admin@example.com", password: "Password123!" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid message payload", () => {
    const result = messageSchema.safeParse({ name: "", email: "bad", subject: "", message: "" });
    expect(result.success).toBe(false);
  });
});
