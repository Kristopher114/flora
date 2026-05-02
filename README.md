# Flora-Chloris Flowershop POS System

A full-stack Point of Sale (POS) and online reservation system for Flora-Chloris Flowershop & Giftshop.

## Requirements

- Node.js v18 or higher (v20+ recommended)
- pnpm v8 or higher

## Installation

1. Install pnpm globally (if not already installed):
   ```
   npm install -g pnpm
   ```

2. Install all dependencies:
   ```
   pnpm install
   ```

3. Copy the environment example and set your values:
   ```
   cp .env.example .env
   ```
   Edit `.env` and fill in your DATABASE_URL and SESSION_SECRET.

4. Push the database schema:
   ```
   pnpm --filter @workspace/db run push
   ```

5. Seed initial data (optional):
   ```
   pnpm --filter @workspace/db run seed
   ```

## Running the Project

Run both the API server and the frontend simultaneously:

```
# Terminal 1 — API Server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/florachloris run dev
```

Or run them together (if concurrently is set up):
```
pnpm dev
```

## Default Credentials

| Role     | Username  | Password    | Access              |
|----------|-----------|-------------|---------------------|
| Admin    | admin     | admin123    | Full admin panel    |
| Cashier  | cashier1  | cashier123  | POS (/cashier)      |
| Customer | customer1 | customer123 | Customer portal (/) |

## URLs

- Customer Portal: http://localhost:20858/
- API Server:      http://localhost:8080/api
- Admin Panel:     http://localhost:20858/admin
- Cashier POS:     http://localhost:20858/cashier

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session)
- **Package Manager**: pnpm workspaces

## Project Structure

```
├── artifacts/
│   ├── florachloris/    # React + Vite frontend
│   └── api-server/      # Express API server
├── lib/
│   ├── api-spec/        # OpenAPI spec + codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/         # Generated Zod schemas
│   └── db/              # Drizzle ORM schema + DB connection
```

---
Exported on April 22, 2026
"# flora" 
