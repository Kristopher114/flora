import { Router } from "express";
import archiver from "archiver";
import path from "path";
import fs from "fs";

const router = Router();

const WORKSPACE_ROOT = path.resolve("/home/runner/workspace");

// Folders/files to completely exclude from the ZIP
const EXCLUDED_DIRS  = new Set(["node_modules", ".git", "dist", ".cache", "__pycache__", ".turbo", "coverage", "tmp"]);
const EXCLUDED_FILES = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const EXCLUDED_PATHS = new Set(["attached_assets"]);

// Generate a README for the zip
function generateReadme(): string {
  return `# Flora-Chloris Flowershop POS System

A full-stack Point of Sale (POS) and online reservation system for Flora-Chloris Flowershop & Giftshop.

## Requirements

- Node.js v18 or higher (v20+ recommended)
- pnpm v8 or higher

## Installation

1. Install pnpm globally (if not already installed):
   \`\`\`
   npm install -g pnpm
   \`\`\`

2. Install all dependencies:
   \`\`\`
   pnpm install
   \`\`\`

3. Copy the environment example and set your values:
   \`\`\`
   cp .env.example .env
   \`\`\`
   Edit \`.env\` and fill in your DATABASE_URL and SESSION_SECRET.

4. Push the database schema:
   \`\`\`
   pnpm --filter @workspace/db run push
   \`\`\`

5. Seed initial data (optional):
   \`\`\`
   pnpm --filter @workspace/db run seed
   \`\`\`

## Running the Project

Run both the API server and the frontend simultaneously:

\`\`\`
# Terminal 1 — API Server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/florachloris run dev
\`\`\`

Or run them together (if concurrently is set up):
\`\`\`
pnpm dev
\`\`\`

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

\`\`\`
├── artifacts/
│   ├── florachloris/    # React + Vite frontend
│   └── api-server/      # Express API server
├── lib/
│   ├── api-spec/        # OpenAPI spec + codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/         # Generated Zod schemas
│   └── db/              # Drizzle ORM schema + DB connection
\`\`\`

---
Exported on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
`;
}

// Generate .env.example
function generateEnvExample(): string {
  return `# Flora-Chloris POS — Environment Variables
# Copy this file to .env and fill in your values

# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/florachloris

# Session secret — use a long random string in production
SESSION_SECRET=change-me-to-a-long-random-string

# Node environment
NODE_ENV=development
`;
}

// Check if a given absolute path should be excluded
function shouldExclude(absolutePath: string): boolean {
  const parts = absolutePath.replace(WORKSPACE_ROOT + path.sep, "").split(path.sep);
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part) || EXCLUDED_PATHS.has(part)) return true;
    if (EXCLUDED_FILES.has(part)) return true;
  }
  return false;
}

// Recursively collect files under a directory
function collectFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (shouldExclude(full)) continue;
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

router.get("/admin/export-zip", async (req, res) => {
  const role = (req as any).session?.role;
  if (role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `florachloris-pos-${timestamp}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err) => {
    console.error("ZIP export error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to create ZIP" });
  });

  archive.pipe(res);

  // Add generated README and .env.example
  archive.append(generateReadme(),    { name: "README.md" });
  archive.append(generateEnvExample(), { name: ".env.example" });

  // Directories to include (relative to workspace root)
  const includeDirs = ["artifacts", "lib", "scripts"];

  // Root-level files to include
  const rootFiles = ["package.json", "pnpm-workspace.yaml", "tsconfig.base.json", "tsconfig.json"];

  // Add root-level files
  for (const file of rootFiles) {
    const full = path.join(WORKSPACE_ROOT, file);
    if (fs.existsSync(full)) {
      archive.file(full, { name: file });
    }
  }

  // Add pnpm-lock.yaml if present (helps reproducible installs)
  const lockfile = path.join(WORKSPACE_ROOT, "pnpm-lock.yaml");
  if (fs.existsSync(lockfile)) {
    archive.file(lockfile, { name: "pnpm-lock.yaml" });
  }

  // Add directories
  for (const dir of includeDirs) {
    const absDir = path.join(WORKSPACE_ROOT, dir);
    const files = collectFiles(absDir);
    for (const file of files) {
      const relativeName = path.relative(WORKSPACE_ROOT, file);
      archive.file(file, { name: relativeName });
    }
  }

  await archive.finalize();
});

export default router;
