import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_IMAGE_MIMES = ["image/webp", "image/png", "image/jpeg"];

function validateImageUrl(imageUrl: unknown): string | null {
  if (imageUrl == null || imageUrl === "") return null;
  if (typeof imageUrl !== "string") return "imageUrl must be a string";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return null;
  const match = imageUrl.match(/^data:(image\/[a-z+]+);base64,/);
  if (!match) return "imageUrl must be a valid URL or base64 data URL";
  if (!ALLOWED_IMAGE_MIMES.includes(match[1])) {
    return `Unsupported image format "${match[1]}". Only webp, png, and jpeg/jpg are accepted.`;
  }
  return null;
}

const fullSelect = {
  id: productsTable.id,
  name: productsTable.name,
  description: productsTable.description,
  price: productsTable.price,
  purchaseCost: productsTable.purchaseCost,
  categoryId: productsTable.categoryId,
  categoryName: categoriesTable.name,
  stockQuantity: productsTable.stockQuantity,
  isAvailable: productsTable.isAvailable,
  imageUrl: productsTable.imageUrl,
  unit: productsTable.unit,
};

function toProduct(p: any) {
  return {
    ...p,
    price: Number(p.price),
    purchaseCost: p.purchaseCost != null ? Number(p.purchaseCost) : null,
  };
}

router.get("/products", async (req, res) => {
  const { categoryId, search, available } = req.query;
  const conditions = [];

  if (categoryId) conditions.push(eq(productsTable.categoryId, Number(categoryId)));
  if (available === "true") conditions.push(eq(productsTable.isAvailable, true));

  let products = await db
    .select(fullSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.name);

  if (search) {
    const term = (search as string).toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(term));
  }

  res.json(products.map(toProduct));
});

router.post("/products", async (req, res) => {
  const { name, description, price, purchaseCost, categoryId, stockQuantity, imageUrl, unit, isAvailable } = req.body;
  if (!name || price == null || !categoryId) {
    res.status(400).json({ error: "name, price, categoryId are required" });
    return;
  }
  const imageError = validateImageUrl(imageUrl);
  if (imageError) { res.status(400).json({ error: imageError }); return; }
  await db.insert(productsTable).values({
    name,
    description,
    price: String(price),
    purchaseCost: purchaseCost != null ? String(purchaseCost) : null,
    categoryId,
    stockQuantity: stockQuantity ?? 0,
    imageUrl,
    unit,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  }).returning();

  const [full] = await db
    .select(fullSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.id)
    .limit(1);

  const [inserted] = await db
    .select(fullSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.name, name))
    .orderBy(productsTable.id);

  res.status(201).json(toProduct(inserted || full));
});

router.get("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db
    .select(fullSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(toProduct(product));
});

router.put("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const updates = { ...req.body };

  if ("imageUrl" in updates) {
    const imageError = validateImageUrl(updates.imageUrl);
    if (imageError) { res.status(400).json({ error: imageError }); return; }
  }

  if (updates.price != null) updates.price = String(updates.price);
  if (updates.purchaseCost != null) updates.purchaseCost = String(updates.purchaseCost);
  else if ("purchaseCost" in updates) updates.purchaseCost = null;

  await db.update(productsTable).set(updates).where(eq(productsTable.id, id));

  const [full] = await db
    .select(fullSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  res.json(toProduct(full));
});

router.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ message: "Product deleted" });
});

export default router;
