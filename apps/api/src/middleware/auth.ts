import { Hono } from "hono";
import * as jose from "jose";
import { logger } from "@wzxklm/rss-agg-core";

const auth = new Hono();

function getJwtSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(secret);
}

// POST /api/auth/login — public, returns JWT
auth.post("/login", async (c) => {
  const body = await c.req.json<{ password?: string }>();
  const expected = process.env["AUTH_PASSWORD"];

  if (!expected) {
    logger.error("AUTH_PASSWORD environment variable is not set");
    return c.json({ error: "Server misconfigured" }, 500);
  }

  if (!body.password || body.password !== expected) {
    logger.warn("POST /api/auth/login 401 (wrong password)");
    return c.json({ error: "Invalid password" }, 401);
  }

  const token = await new jose.SignJWT({ sub: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  logger.info("User logged in, JWT issued");
  return c.json({ token });
});

// JWT verification middleware for all other routes
export async function requireAuth(c: any, next: () => Promise<void>): Promise<void | Response> {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization required" }, 401);
  }

  const token = header.slice(7);
  try {
    await jose.jwtVerify(token, getJwtSecret());
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export { auth };
