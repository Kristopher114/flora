import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    phone: user.phone ?? null,
    email: user.email ?? null,
  };
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  (req as any).session = (req as any).session || {};
  (req as any).session.userId = user.id;
  (req as any).session.role = user.role;
  res.json({ user: safeUser(user), message: "Logged in successfully" });
});

router.post("/auth/register", async (req, res) => {
  const { username, password, name, phone, email } = req.body;
  if (!username || !password || !name) {
    res.status(400).json({ error: "username, password, and name are required" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(409).json({ error: "Username already taken. Please choose another." });
    return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({ username, password, name, phone: phone || null, email: email || null, role: "customer" })
    .returning();
  (req as any).session = (req as any).session || {};
  (req as any).session.userId = user.id;
  (req as any).session.role = user.role;
  res.status(201).json({ user: safeUser(user), message: "Account created successfully" });
});

router.put("/auth/profile", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { name, phone, email, currentPassword, newPassword } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required to set a new password" });
      return;
    }
    if (user.password !== currentPassword) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone || null;
  if (email !== undefined) updates.email = email || null;
  if (newPassword) updates.password = newPassword;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  res.json(safeUser(updated));
});

router.post("/auth/logout", (req, res) => {
  if ((req as any).session) {
    (req as any).session.destroy?.();
  }
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(safeUser(user));
});

export default router;
