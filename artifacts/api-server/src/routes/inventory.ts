import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/inventory", async (_req, res) => {
  const items = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      categoryName: categoriesTable.name,
      stockQuantity: productsTable.stockQuantity,
      isAvailable: productsTable.isAvailable,
      price: productsTable.price,
      unit: productsTable.unit,
      imageUrl: productsTable.imageUrl,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.name);

  res.json(items.map((i) => ({ ...i, price: Number(i.price) })));
});

router.put("/inventory/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const { stockQuantity, isAvailable } = req.body;

  const updates: Record<string, unknown> = {};
  if (stockQuantity != null) updates.stockQuantity = stockQuantity;
  if (isAvailable != null) updates.isAvailable = isAvailable;

  await db.update(productsTable).set(updates).where(eq(productsTable.id, productId));

  const [item] = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      categoryName: categoriesTable.name,
      stockQuantity: productsTable.stockQuantity,
      isAvailable: productsTable.isAvailable,
      price: productsTable.price,
      unit: productsTable.unit,
      imageUrl: productsTable.imageUrl,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, productId));

  res.json({ ...item, price: Number(item.price) });
});

export default router;
