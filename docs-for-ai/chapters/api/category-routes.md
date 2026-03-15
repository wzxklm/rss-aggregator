# Category Routes — CRUD for feed categories

## Overview

Exposes endpoints for listing, creating, updating, and deleting feed categories. All endpoints require auth. Purely delegates to `categoryService` with no direct DB access.

## Key Behaviors

- **List**: Returns all categories (with feed counts, per service implementation)
- **Create**: Requires `name` in body; returns 400 if missing
- **Update**: Accepts optional `name` and `sortOrder` fields
- **Delete**: Removes category; entries/feeds retain their data (category association removed)

## Interface

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/api/categories` | GET | Yes | -- | `Category[]` |
| `/api/categories` | POST | Yes | Body: `{name: string}` | `Category` (201) |
| `/api/categories/:id` | PATCH | Yes | Param: `id`; Body: `{name?: string, sortOrder?: number}` | `Category` |
| `/api/categories/:id` | DELETE | Yes | Param: `id` | `Category` |

## Internal Details

- Simplest route module -- all operations are direct pass-through to `categoryService`
- Error mapping: service `result.error` -> 400 (create), 404 (update/delete), 500 (list)

## Dependencies

- Uses: `categoryService` (core)
- Used by: Web frontend, CLI (via HTTP)
