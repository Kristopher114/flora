import { db } from "./index";
import { usersTable } from "./schema/users";
import { categoriesTable } from "./schema/categories";
import { productsTable } from "./schema/products";
import { ordersTable } from "./schema/orders";
import { reservationsTable } from "./schema/reservations";

async function seed() {
  console.log("🌱 Starting full database seed for Flora Chloris...");

  try {
    // ---------------------------------------------------------
    // 0. WIPE EXISTING DATA (To prevent duplicate errors)
    // We delete in reverse order of relationships!
    // ---------------------------------------------------------
    console.log("🧹 Cleaning up old data...");
    await db.delete(reservationsTable);
    await db.delete(ordersTable);
    await db.delete(productsTable);
    await db.delete(usersTable);
    await db.delete(categoriesTable);

    // ---------------------------------------------------------
    // 1. SEED CATEGORIES
    // ---------------------------------------------------------
    console.log("Adding Categories...");
    const insertedCategories = await db.insert(categoriesTable).values([
      { name: "Indoor Plants", description: "Low-light and house friendly plants.", emoji: "🪴" },
      { name: "Outdoor Plants", description: "Sun-loving garden plants.", emoji: "🌻" },
      { name: "Pots & Planters", description: "Terracotta, ceramic, and plastic pots.", emoji: "🏺" },
      { name: "Soil & Fertilizers", description: "Loam soil, pumice, and plant food.", emoji: "🪨" },
    ]).returning({ id: categoriesTable.id });

    // ---------------------------------------------------------
    // 2. SEED USERS
    // ---------------------------------------------------------
    console.log("Adding Users...");
    const insertedUsers = await db.insert(usersTable).values([
      {
        username: "admin_alice",
        password: "securepassword123", 
        name: "Alice Admin",
        phone: "+639171234567",
        email: "alice@florachloris.com",
        role: "admin",
      },
      {
        username: "juan_delacruz",
        password: "password123",
        name: "Juan Dela Cruz",
        phone: "09189876543",
        email: "juan@example.com",
        role: "customer",
      },
      {
        username: "jose_cashier",
        password: "password123",
        name: "Jose Dela Cruz",
        phone: "09189876543",
        email: "jose@example.com",
        role: "cashier",
      }
    ]).returning({ 
      id: usersTable.id, 
      name: usersTable.name, 
      phone: usersTable.phone, 
      email: usersTable.email 
    }); // <--- HERE IS THE FIX! We grab the name and phone now!

    // ---------------------------------------------------------
    // 3. SEED PRODUCTS
    // ---------------------------------------------------------
    console.log("Adding Products...");
    const catIndoor = insertedCategories[0].id;
    const catOutdoor = insertedCategories[1].id;
    const catPots = insertedCategories[2].id;
    const catSoil = insertedCategories[3].id;

    const insertedProducts = await db.insert(productsTable).values([
      {
        name: "Monstera Deliciosa",
        description: "Classic indoor plant with split leaves.",
        price: "450.00",
        categoryId: catIndoor,
        stockQuantity: 15,
        isAvailable: true,
        unit: "piece",
        purchaseCost: "250.00",
      },
      {
        name: "Bougainvillea (Pink)",
        description: "Vibrant outdoor flowering plant.",
        price: "200.00",
        categoryId: catOutdoor,
        stockQuantity: 30,
        isAvailable: true,
        unit: "piece",
        purchaseCost: "100.00",
      },
      {
        name: "Terracotta Pot (Medium)",
        description: "Breathable clay pot, 8x8 inches.",
        price: "150.00",
        categoryId: catPots,
        stockQuantity: 50,
        isAvailable: true,
        unit: "piece",
        purchaseCost: "80.00",
      },
      {
        name: "Premium Loam Soil",
        description: "Nutrient-rich potting mix.",
        price: "75.00",
        categoryId: catSoil,
        stockQuantity: 100,
        isAvailable: true,
        unit: "bag",
        purchaseCost: "40.00",
      }
    ]).returning({ id: productsTable.id, name: productsTable.name, price: productsTable.price });

    // ---------------------------------------------------------
    // 4. SEED ORDERS
    // ---------------------------------------------------------
    console.log("Adding Orders...");
    const p1 = insertedProducts[0];
    const p2 = insertedProducts[2];

    await db.insert(ordersTable).values([
      {
        orderNumber: `ORD-${Date.now()}-01`,
        type: "walk_in",
        status: "pending",
        customerName: "Maria Santos",
        customerPhone: "09201239876",
        items: [
          { productId: p1.id, productName: p1.name, quantity: 1, unitPrice: Number(p1.price), subtotal: 450.00 },
          { productId: p2.id, productName: p2.name, quantity: 2, unitPrice: Number(p2.price), subtotal: 300.00 }
        ],
        subtotal: "750.00",
        total: "750.00",
        paymentMethod: "cash",
        notes: "Customer asked for a healthy Monstera leaf.",
      }
    ]);

    // ---------------------------------------------------------
    // 5. SEED RESERVATIONS
    // ---------------------------------------------------------
    console.log("Adding Reservations...");
    const customerUser = insertedUsers[1]; // This is Juan
    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 3);

    await db.insert(reservationsTable).values([
      {
        reservationNumber: `RES-${Date.now()}-01`,
        userId: customerUser.id,
        customerName: customerUser.name, // Now this has a value!
        customerPhone: customerUser.phone || "N/A", // Now this has a value!
        customerEmail: customerUser.email,
        items: [
          { productId: insertedProducts[1].id, productName: insertedProducts[1].name, quantity: 5, unitPrice: Number(insertedProducts[1].price), subtotal: 1000.00 },
          { productId: insertedProducts[3].id, productName: insertedProducts[3].name, quantity: 2, unitPrice: Number(insertedProducts[3].price), subtotal: 150.00 }
        ],
        pickupDate: pickupDate,
        status: "pending",
        total: "1150.00",
        notes: "Please prepare in separate plastic bags.",
        paymentMethod: "gcash",
        fulfillmentType: "pickup",
      }
    ]);

    console.log("✨ All entities seeded successfully! You are ready to build the frontend.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();