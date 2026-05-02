import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  res.json(categories);
});

router.post("/categories", async (req, res) => {
  const { name, description, emoji } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const [category] = await db.insert(categoriesTable).values({ name, description, emoji }).returning();
  res.status(201).json(category);
});

export default router;
