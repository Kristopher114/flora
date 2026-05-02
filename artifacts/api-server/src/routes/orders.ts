import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

router.get("/orders", async (req, res) => {
  const { status, type } = req.query;
  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status as any));
  if (type) conditions.push(eq(ordersTable.type, type as any));

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(ordersTable.createdAt);

  res.json(orders.map((o) => ({ ...o, subtotal: Number(o.subtotal), total: Number(o.total) })).reverse());
});

router.post("/orders", async (req, res) => {
  const { type, customerName, customerPhone, items, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ error: "Items are required" });
    return;
  }

  const orderItems: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }> = [];
  let subtotal = 0;

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(404).json({ error: `Product ${item.productId} not found` });
      return;
    }
    if (product.stockQuantity < item.quantity) {
      res.status(400).json({
        error: `Not enough stock for "${product.name}". Only ${product.stockQuantity} item${product.stockQuantity !== 1 ? "s" : ""} available.`,
      });
      return;
    }
    const unitPrice = Number(product.price);
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
    });
    await db.update(productsTable)
      .set({ stockQuantity: product.stockQuantity - item.quantity })
      .where(eq(productsTable.id, product.id));
  }

  const [order] = await db.insert(ordersTable).values({
    orderNumber: generateOrderNumber(),
    type: type || "walk_in",
    status: paymentMethod ? "completed" : "pending",
    customerName,
    customerPhone,
    items: orderItems,
    subtotal: String(subtotal),
    total: String(subtotal),
    paymentMethod,
    notes,
  }).returning();

  res.status(201).json({ ...order, subtotal: Number(order.subtotal), total: Number(order.total) });
});

router.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ ...order, subtotal: Number(order.subtotal), total: Number(order.total) });
});

router.put("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, paymentMethod } = req.body;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (paymentMethod) updates.paymentMethod = paymentMethod;

  await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id));
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  res.json({ ...order, subtotal: Number(order.subtotal), total: Number(order.total) });
});

router.get("/dashboard/stats", async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allOrders = await db.select().from(ordersTable);
  const allProducts = await db.select().from(productsTable);

  const todayOrders = allOrders.filter(
    (o) => new Date(o.createdAt) >= startOfDay && o.status !== "cancelled"
  );
  const monthOrders = allOrders.filter(
    (o) => new Date(o.createdAt) >= startOfMonth && o.status !== "cancelled"
  );

  const totalSalesToday = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalSalesThisMonth = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const lowStockItems = allProducts.filter((p) => p.stockQuantity < 10).length;

  const { reservationsTable } = await import("@workspace/db");
  const reservations = await db.select().from(reservationsTable);
  const pendingReservations = reservations.filter((r) => r.status === "pending").length;

  res.json({
    totalSalesToday,
    totalOrdersToday: todayOrders.length,
    pendingReservations,
    lowStockItems,
    totalSalesThisMonth,
    totalOrdersThisMonth: monthOrders.length,
  });
});

router.get("/dashboard/bi-stats", async (req, res) => {
  const period = (req.query.period as string) || "weekly";
  const now = new Date();

  const { reservationsTable, categoriesTable } = await import("@workspace/db");

  const allOrders = await db.select().from(ordersTable);
  const allReservations = await db.select().from(reservationsTable);
  const allProducts = await db.select().from(productsTable);
  const allCategories = await db.select().from(categoriesTable);

  const validOrders = allOrders.filter((o) => o.status !== "cancelled");
  const completedReservations = allReservations.filter((r) => r.status === "completed");
  const validReservations = allReservations.filter((r) => r.status !== "cancelled");

  const totalSalesAllTime =
    validOrders.reduce((sum, o) => sum + Number(o.total), 0) +
    completedReservations.reduce((sum, r) => sum + Number(r.total), 0);

  const totalTransactions = validOrders.length + completedReservations.length;

  const productQty: Record<string, number> = {};
  for (const order of validOrders) {
    for (const item of (order.items as Array<{ productName: string; quantity: number }>)) {
      productQty[item.productName] = (productQty[item.productName] || 0) + item.quantity;
    }
  }
  for (const reservation of validReservations) {
    for (const item of (reservation.items as Array<{ productName: string; quantity: number }>)) {
      productQty[item.productName] = (productQty[item.productName] || 0) + item.quantity;
    }
  }
  const topSellingProduct = Object.entries(productQty).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const totalReservations = allReservations.length;
  const lowStockItems = allProducts.filter((p) => p.stockQuantity < 10).length;

  const allSalesEntries = [
    ...validOrders.map((o) => ({ date: new Date(o.createdAt), total: Number(o.total) })),
    ...completedReservations.map((r) => ({ date: new Date(r.createdAt), total: Number(r.total) })),
  ];

  let salesTrend: Array<{ name: string; sales: number }> = [];

  if (period === "daily") {
    salesTrend = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const total = allSalesEntries
        .filter((e) => e.date >= dayStart && e.date < dayEnd)
        .reduce((sum, e) => sum + e.total, 0);
      return {
        name: dayStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        sales: total,
      };
    });
  } else if (period === "weekly") {
    salesTrend = Array.from({ length: 8 }, (_, i) => {
      const startOfCurrentWeek = new Date(now);
      startOfCurrentWeek.setDate(now.getDate() - now.getDay());
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      const weekStart = new Date(startOfCurrentWeek);
      weekStart.setDate(startOfCurrentWeek.getDate() - 7 * (7 - i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const total = allSalesEntries
        .filter((e) => e.date >= weekStart && e.date < weekEnd)
        .reduce((sum, e) => sum + e.total, 0);
      return {
        name: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: total,
      };
    });
  } else if (period === "monthly") {
    salesTrend = Array.from({ length: 12 }, (_, i) => {
      const offset = 11 - i;
      const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      const total = allSalesEntries
        .filter((e) => e.date >= monthStart && e.date < monthEnd)
        .reduce((sum, e) => sum + e.total, 0);
      return {
        name: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        sales: total,
      };
    });
  } else {
    salesTrend = Array.from({ length: 5 }, (_, i) => {
      const year = now.getFullYear() - (4 - i);
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year + 1, 0, 1);
      const total = allSalesEntries
        .filter((e) => e.date >= yearStart && e.date < yearEnd)
        .reduce((sum, e) => sum + e.total, 0);
      return { name: year.toString(), sales: total };
    });
  }

  const categoryMap: Record<number, string> = {};
  for (const cat of allCategories) {
    categoryMap[cat.id] = cat.name;
  }

  const stockByCategoryMap: Record<string, number> = {};
  for (const product of allProducts) {
    const catName = categoryMap[product.categoryId] || "Other";
    stockByCategoryMap[catName] = (stockByCategoryMap[catName] || 0) + product.stockQuantity;
  }

  const salesByCategoryMap: Record<string, number> = {};
  for (const order of validOrders) {
    for (const item of (order.items as Array<{ productId: number; subtotal: number }>)) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        const catName = categoryMap[product.categoryId] || "Other";
        salesByCategoryMap[catName] = (salesByCategoryMap[catName] || 0) + item.subtotal;
      }
    }
  }
  for (const reservation of validReservations) {
    for (const item of (reservation.items as Array<{ productId: number; subtotal: number }>)) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        const catName = categoryMap[product.categoryId] || "Other";
        salesByCategoryMap[catName] = (salesByCategoryMap[catName] || 0) + item.subtotal;
      }
    }
  }

  res.json({
    totalSalesAllTime,
    totalTransactions,
    topSellingProduct,
    totalReservations,
    lowStockItems,
    salesTrend,
    stockByCategory: Object.entries(stockByCategoryMap).map(([name, stock]) => ({ name, stock })),
    orderTypeBreakdown: {
      posOrders: validOrders.length,
      reservationOrders: validReservations.length,
    },
    salesByCategory: Object.entries(salesByCategoryMap).map(([name, total]) => ({ name, total })),
  });
});

export default router;
