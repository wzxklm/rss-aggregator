# Auth Middleware — JWT login and route protection

## Overview

Provides a `POST /api/auth/login` endpoint that validates a plaintext password and issues a JWT, plus a `requireAuth` middleware that verifies Bearer tokens on protected routes.

## Key Behaviors

- **Login**: Compares `body.password` against `AUTH_PASSWORD` env var. On match, issues HS256 JWT with `{sub: "user"}`, 7-day expiry. Returns `{token}` on success
- **Token verification**: `requireAuth` extracts Bearer token from `Authorization` header, verifies via `jose.jwtVerify()`. Calls `next()` on success, returns 401 on missing/invalid/expired token
- **Secret encoding**: `getJwtSecret()` reads `JWT_SECRET` env var and encodes with `TextEncoder` on every call (not cached)
- **Error responses**: Missing `AUTH_PASSWORD` -> 500 `"Server misconfigured"`; wrong password -> 401 `"Invalid password"`; no/bad token -> 401 `"Authorization required"` or `"Invalid or expired token"`

## Interface

| Endpoint | Method | Auth | Request Body | Response |
|----------|--------|------|-------------|----------|
| `/api/auth/login` | POST | No | `{password: string}` | `{token: string}` |

Exports: `auth` (Hono router), `requireAuth(c, next)` (middleware function)

## Internal Details

- JWT payload contains only `{sub: "user"}` -- single-user model, no user ID or roles
- `requireAuth` typed with `c: any` to work as both Hono middleware and standalone guard
- Uses `jose` library (not `jsonwebtoken`) for JWT sign/verify

## Dependencies

- Uses: `jose`, `hono`, `logger` (core)
- Used by: `apps/api/src/index.ts` (registers login route, applies `requireAuth` to all protected route groups)
