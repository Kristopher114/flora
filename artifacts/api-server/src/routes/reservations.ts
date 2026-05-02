import { Router, type IRouter } from "express";
import { db, reservationsTable, productsTable, usersTable } from "@workspace/db";
import { eq, and, or, isNull, sql } from "drizzle-orm";

const router: IRouter = Router();

function generateReservationNumber(): string {
  return `RES-${Math.floor(10000 + Math.random() * 90000)}`;
}

function serialize(r: typeof reservationsTable.$inferSelect) {
  return { ...r, total: Number(r.total) };
}

router.get("/reservations/my", async (req, res) => {
  const session = (req as any).session;
  const userId = session?.userId;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Look up the logged-in user's phone so we can also surface old guest reservations
  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const userPhone = currentUser?.phone ?? null;

  // Return reservations linked to this userId OR old guest reservations matched by phone
  const conditions = userPhone
    ? or(
        eq(reservationsTable.userId, userId),
        and(isNull(reservationsTable.userId), eq(reservationsTable.customerPhone, userPhone))
      )
    : eq(reservationsTable.userId, userId);

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(conditions)
    .orderBy(reservationsTable.createdAt);

  res.json(reservations.map(serialize).reverse());
});

router.get("/reservations", async (req, res) => {
  const { status } = req.query;
  const conditions = [];
  if (status) conditions.push(eq(reservationsTable.status, status as any));

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(reservationsTable.createdAt);

  res.json(reservations.map(serialize).reverse());
});

router.post("/reservations", async (req, res) => {
  const { customerName, customerPhone, customerEmail, items, pickupDate, notes, paymentMethod, fulfillmentType } = req.body;

  if (!customerName || !customerPhone || !items || items.length === 0 || !pickupDate) {
    res.status(400).json({ error: "customerName, customerPhone, items, and pickupDate are required" });
    return;
  }

  const session = (req as any).session;
  const sessionUserId: number | null = session?.userId ?? null;

  const reservationItems: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }> = [];
  let total = 0;

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(404).json({ error: `Product ${item.productId} not found` });
      return;
    }
    if (product.stockQuantity < item.quantity) {
      res.status(400).json({ error: `Not enough stock for "${product.name}". Available: ${product.stockQuantity}` });
      return;
    }
    const unitPrice = Number(product.price);
    const itemSubtotal = unitPrice * item.quantity;
    total += itemSubtotal;
    reservationItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
    });
  }

  // Deduct stock for each item
  for (const item of reservationItems) {
    await db
      .update(productsTable)
      .set({ stockQuantity: sql`${productsTable.stockQuantity} - ${item.quantity}` })
      .where(eq(productsTable.id, item.productId));
  }

  const [reservation] = await db.insert(reservationsTable).values({
    reservationNumber: generateReservationNumber(),
    userId: sessionUserId,
    customerName,
    customerPhone,
    customerEmail,
    items: reservationItems,
    pickupDate: new Date(pickupDate),
    status: "pending",
    total: String(total),
    notes,
    paymentMethod: paymentMethod || null,
    fulfillmentType: fulfillmentType || "pickup",
  }).returning();

  res.status(201).json(serialize(reservation));
});

router.get("/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.json(serialize(reservation));
});

router.put("/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const session = (req as any).session;
  const userId: number | null = session?.userId ?? null;
  const userRole: string | null = session?.role ?? null;

  const [existing] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  if (userRole !== "admin" && userRole !== "cashier") {
    // Allow if the reservation is linked to this user by userId
    const ownedByUserId = existing.userId === userId;
    // Or if it's an old guest reservation matched by the user's phone number
    let ownedByPhone = false;
    if (!ownedByUserId && existing.userId === null && userId) {
      const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      ownedByPhone = !!(currentUser?.phone && currentUser.phone === existing.customerPhone);
    }
    if (!ownedByUserId && !ownedByPhone) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const { status } = req.body;

  // Enforce cancellation time-limit for customers
  if (userRole === "customer" && status === "cancelled") {
    const CANCEL_WINDOW_HOURS = 7;
    const ADMIN_OVERDUE_DAYS = 2;
    const msSince = Date.now() - new Date(existing.createdAt!).getTime();
    const hoursSince = msSince / (1000 * 60 * 60);
    const daysSince = hoursSince / 24;
    const withinWindow = hoursSince <= CANCEL_WINDOW_HOURS;
    const adminOverdue = daysSince >= ADMIN_OVERDUE_DAYS && existing.status === "pending";

    if (!withinWindow && !adminOverdue) {
      res.status(403).json({
        error: "Cancellation window has closed. You can only cancel within 7 hours of placing the reservation, or if the admin has not confirmed it within 2 days.",
      });
      return;
    }
  }

  // Restore stock when a reservation is cancelled (only if it was previously not already cancelled)
  if (status === "cancelled" && existing.status !== "cancelled") {
    const items = existing.items as Array<{ productId: number; quantity: number }>;
    for (const item of items) {
      await db
        .update(productsTable)
        .set({ stockQuantity: sql`${productsTable.stockQuantity} + ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }
  }

  await db.update(reservationsTable).set({ status }).where(eq(reservationsTable.id, id));
  const [updated] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  res.json(serialize(updated));
});

export default router;
