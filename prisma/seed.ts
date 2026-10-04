import { PrismaClient, StockStatus, ShippingMode, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SettingsSchemaMap } from "../src/lib/settings/registry";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seed...");

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@crackers.local";
  const adminRawPassword = process.env.ADMIN_PASSWORD || "ChangeMeImmediately123!";
  const adminName = process.env.ADMIN_NAME || "Primary Administrator";

  const passwordHash = await bcrypt.hash(adminRawPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: true,
      tokenVersion: 1,
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Seed Default Settings
  for (const [key, schema] of Object.entries(SettingsSchemaMap)) {
    const defaultValue = schema.parse(undefined);
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value: defaultValue as any,
        type: typeof defaultValue,
        updatedById: admin.id,
      },
    });
  }
  console.log("✅ Settings seeded successfully.");

  // 3. Seed 36 Indian States & Union Territories
  const indianStates = [
    { code: "AP", name: "Andhra Pradesh", isUnionTerr: false },
    { code: "AR", name: "Arunachal Pradesh", isUnionTerr: false },
    { code: "AS", name: "Assam", isUnionTerr: false },
    { code: "BR", name: "Bihar", isUnionTerr: false },
    { code: "CG", name: "Chhattisgarh", isUnionTerr: false },
    { code: "GA", name: "Goa", isUnionTerr: false },
    { code: "GJ", name: "Gujarat", isUnionTerr: false },
    { code: "HR", name: "Haryana", isUnionTerr: false },
    { code: "HP", name: "Himachal Pradesh", isUnionTerr: false },
    { code: "JH", name: "Jharkhand", isUnionTerr: false },
    { code: "KA", name: "Karnataka", isUnionTerr: false },
    { code: "KL", name: "Kerala", isUnionTerr: false },
    { code: "MP", name: "Madhya Pradesh", isUnionTerr: false },
    { code: "MH", name: "Maharashtra", isUnionTerr: false },
    { code: "MN", name: "Manipur", isUnionTerr: false },
    { code: "ML", name: "Meghalaya", isUnionTerr: false },
    { code: "MZ", name: "Mizoram", isUnionTerr: false },
    { code: "NL", name: "Nagaland", isUnionTerr: false },
    { code: "OD", name: "Odisha", isUnionTerr: false },
    { code: "PB", name: "Punjab", isUnionTerr: false },
    { code: "RJ", name: "Rajasthan", isUnionTerr: false },
    { code: "SK", name: "Sikkim", isUnionTerr: false },
    { code: "TN", name: "Tamil Nadu", isUnionTerr: false },
    { code: "TS", name: "Telangana", isUnionTerr: false },
    { code: "TR", name: "Tripura", isUnionTerr: false },
    { code: "UP", name: "Uttar Pradesh", isUnionTerr: false },
    { code: "UK", name: "Uttarakhand", isUnionTerr: false },
    { code: "WB", name: "West Bengal", isUnionTerr: false },
    { code: "AN", name: "Andaman and Nicobar Islands", isUnionTerr: true },
    { code: "CH", name: "Chandigarh", isUnionTerr: true },
    { code: "DN", name: "Dadra & Nagar Haveli and Daman & Diu", isUnionTerr: true },
    { code: "DL", name: "Delhi (NCT)", isUnionTerr: true },
    { code: "JK", name: "Jammu and Kashmir", isUnionTerr: true },
    { code: "LA", name: "Ladakh", isUnionTerr: true },
    { code: "LD", name: "Lakshadweep", isUnionTerr: true },
    { code: "PY", name: "Puducherry", isUnionTerr: true },
  ];

  for (const st of indianStates) {
    await prisma.state.upsert({
      where: { code: st.code },
      update: { name: st.name, isUnionTerr: st.isUnionTerr, isActive: true },
      create: { code: st.code, name: st.name, isUnionTerr: st.isUnionTerr, isActive: true },
    });
  }
  console.log(`✅ ${indianStates.length} Indian States and Union Territories seeded.`);

  // 4. Seed Delivery Rules (DEMO values clearly labelled)
  await prisma.deliveryRule.upsert({
    where: { id: "rule-default" },
    update: {},
    create: {
      id: "rule-default",
      name: "[DEMO] All Other States Standard Rule",
      isDefault: true,
      isDeliverable: true,
      minOrderPaise: 500000, // ₹5,000
      shippingMode: ShippingMode.FREE_ABOVE_THRESHOLD,
      freeShippingThresholdPaise: 1000000, // ₹10,000
      messageText: "Direct Sivakasi transport to your nearest district logistics hub.",
      priority: 0,
      isActive: true,
    },
  });

  await prisma.deliveryRule.upsert({
    where: { id: "rule-tn-py" },
    update: {},
    create: {
      id: "rule-tn-py",
      name: "[DEMO] Tamil Nadu & Puducherry Fast Delivery",
      isDefault: false,
      isDeliverable: true,
      minOrderPaise: 300000, // ₹3,000
      shippingMode: ShippingMode.CONFIRMED_OFFLINE,
      freeShippingThresholdPaise: null,
      messageText: "Express 24-48 hr dispatch across Tamil Nadu & Puducherry hubs.",
      priority: 10,
      isActive: true,
      states: {
        connect: [{ code: "TN" }, { code: "PY" }],
      },
    },
  });
  console.log("✅ Demo Delivery Rules seeded (TN/PY ₹3,000; Others ₹5,000).");

  // 5. Seed 12 Categories with vibrant gradients
  const categoriesData = [
    { name: "One Sound Crackers", slug: "one-sound-crackers", colorFrom: "#FF2E93", colorTo: "#FF7A18", desc: "Classic Sivakasi atom bombs, hydro bombs and single sound crackers." },
    { name: "Sparklers", slug: "sparklers", colorFrom: "#FFC83D", colorTo: "#FF7A18", desc: "Golden, electric, red, green and colour changing sparklers." },
    { name: "Flower Pots", slug: "flower-pots", colorFrom: "#22D3EE", colorTo: "#3B82F6", desc: "Vibrant shower flower pots: Ashoka, Special, Giant and Tri-colour." },
    { name: "Ground Spinners", slug: "ground-spinners", colorFrom: "#A3E635", colorTo: "#10B981", desc: "Fast-whirling ground chakkars with vibrant spark patterns." },
    { name: "Fountains", slug: "fountains", colorFrom: "#EC4899", colorTo: "#8B5CF6", desc: "High-rising fountain showers and musical whistles." },
    { name: "Rockets", slug: "rockets", colorFrom: "#F97316", colorTo: "#EF4444", desc: "Sky-touching whistle and parachute rockets." },
    { name: "Multi-shot and Night Shots", slug: "multi-shot-and-night-shots", colorFrom: "#8B5CF6", colorTo: "#3B82F6", desc: "Aerial repeaters, 12-shot, 30-shot, 60-shot and 120-shot night sky wonders." },
    { name: "Fancy and Novelty", slug: "fancy-and-novelty", colorFrom: "#06B6D4", colorTo: "#A855F7", desc: "Peacock, Butterfly, Drone and helicopter novelties." },
    { name: "Twinkling Star and Pencil", slug: "twinkling-star-and-pencil", colorFrom: "#FBBF24", colorTo: "#F43F5E", desc: "Magical whistling pencils, torch lights and twinkling sticks." },
    { name: "Garlands", slug: "garlands", colorFrom: "#EF4444", colorTo: "#B91C1C", desc: "Traditional red festival garlands: 100 wala to 5000 wala." },
    { name: "Gift Boxes", slug: "gift-boxes", colorFrom: "#6366F1", colorTo: "#EC4899", desc: "Hand-picked family festival boxes and corporate gift hampers." },
    { name: "Kids Special", slug: "kids-special", colorFrom: "#10B981", colorTo: "#06B6D4", desc: "Low-smoke, kid-friendly sparklers, roll caps and serpent eggs." },
  ];

  const categoryMap = new Map<string, string>();
  for (let i = 0; i < categoriesData.length; i++) {
    const cat = categoriesData[i]!;
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        colorFrom: cat.colorFrom,
        colorTo: cat.colorTo,
        description: cat.desc,
        sortOrder: i + 1,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        colorFrom: cat.colorFrom,
        colorTo: cat.colorTo,
        description: cat.desc,
        sortOrder: i + 1,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✅ 12 Categories seeded.`);

  // 6. Seed 84 Realistic Products (7 per category)
  const productTemplates: Array<{
    catSlug: string;
    items: Array<{
      sku: string;
      name: string;
      pack: string;
      unit: string;
      mrp: number; // in Rs
      price: number; // in Rs
      bestseller?: boolean;
      featured?: boolean;
      newArrival?: boolean;
      premium?: boolean;
    }>;
  }> = [
    {
      catSlug: "one-sound-crackers",
      items: [
        { sku: "OS-01", name: "2.75\" Kuruvi Crackers", pack: "1 Pkt (10 Pcs)", unit: "Pkt", mrp: 40, price: 16, bestseller: true },
        { sku: "OS-02", name: "3.5\" Laxmi Crackers", pack: "1 Pkt (10 Pcs)", unit: "Pkt", mrp: 60, price: 24, bestseller: true },
        { sku: "OS-03", name: "4\" Deluxe Laxmi", pack: "1 Pkt (10 Pcs)", unit: "Pkt", mrp: 90, price: 36, featured: true },
        { sku: "OS-04", name: "Classic 2-Sound Crackers", pack: "1 Pkt (10 Pcs)", unit: "Pkt", mrp: 120, price: 48 },
        { sku: "OS-05", name: "Mega Bullet Bomb", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 150, price: 60, bestseller: true },
        { sku: "OS-06", name: "Hydro Green Bomb Special", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 220, price: 88, featured: true },
        { sku: "OS-07", name: "King Kong Titan Bomb", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 300, price: 120, premium: true },
      ],
    },
    {
      catSlug: "sparklers",
      items: [
        { sku: "SP-01", name: "7cm Electric Sparklers", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 50, price: 20, bestseller: true },
        { sku: "SP-02", name: "10cm Electric Sparklers", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 80, price: 32, bestseller: true },
        { sku: "SP-03", name: "12cm Golden Sparklers", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 110, price: 44, featured: true },
        { sku: "SP-04", name: "15cm Red Sparklers", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 150, price: 60 },
        { sku: "SP-05", name: "15cm Green Sparklers", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 160, price: 64 },
        { sku: "SP-06", name: "30cm Jumbo Electric Sparklers", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 200, price: 80, bestseller: true },
        { sku: "SP-07", name: "50cm Giant Mega Sparklers", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 380, price: 152, premium: true },
      ],
    },
    {
      catSlug: "flower-pots",
      items: [
        { sku: "FP-01", name: "Flower Pots Small", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 140, price: 56, bestseller: true },
        { sku: "FP-02", name: "Flower Pots Big", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 220, price: 88, bestseller: true },
        { sku: "FP-03", name: "Flower Pots Special", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 300, price: 120, featured: true },
        { sku: "FP-04", name: "Flower Pots Ashoka Giant", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 450, price: 180, bestseller: true },
        { sku: "FP-05", name: "Tri-Colour Fountain Pots", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 500, price: 200, newArrival: true },
        { sku: "FP-06", name: "Royal Gold Shower Pots", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 650, price: 260, premium: true },
        { sku: "FP-07", name: "Colour Kokila Deluxe Pots", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 750, price: 300, premium: true },
      ],
    },
    {
      catSlug: "ground-spinners",
      items: [
        { sku: "GS-01", name: "Ground Spinner Special", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 110, price: 44, bestseller: true },
        { sku: "GS-02", name: "Ground Spinner Deluxe", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 180, price: 72, bestseller: true },
        { sku: "GS-03", name: "Whistling Wheel Spinner", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 260, price: 104, featured: true },
        { sku: "GS-04", name: "Colour Disco Wheel", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 320, price: 128 },
        { sku: "GS-05", name: "Spinning Drone Chakkar", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 400, price: 160, newArrival: true },
        { sku: "GS-06", name: "Musical Multi-Chakkar", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 480, price: 192 },
        { sku: "GS-07", name: "Titan Mega Ground Spinner", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 600, price: 240, premium: true },
      ],
    },
    {
      catSlug: "fountains",
      items: [
        { sku: "FT-01", name: "Red & Green Shower Fountain", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 200, price: 80, bestseller: true },
        { sku: "FT-02", name: "Golden Cascade Fountain", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 280, price: 112 },
        { sku: "FT-03", name: "Crackling King Fountain", pack: "1 Box (3 Pcs)", unit: "Box", mrp: 380, price: 152, featured: true },
        { sku: "FT-04", name: "Sivakasi Star Shower Jumbo", pack: "1 Box (2 Pcs)", unit: "Box", mrp: 550, price: 220, bestseller: true },
        { sku: "FT-05", name: "Musical Siren Fountain", pack: "1 Box (3 Pcs)", unit: "Box", mrp: 600, price: 240, newArrival: true },
        { sku: "FT-06", name: "7 Colour Rainbow Fountain", pack: "1 Box (2 Pcs)", unit: "Box", mrp: 750, price: 300, premium: true },
        { sku: "FT-07", name: "Imperial Niagara Falls 3ft", pack: "1 Pcs", unit: "Pcs", mrp: 950, price: 380, premium: true },
      ],
    },
    {
      catSlug: "rockets",
      items: [
        { sku: "RK-01", name: "Baby Whistling Rocket", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 180, price: 72, bestseller: true },
        { sku: "RK-02", name: "Bomb Rocket High Altitude", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 280, price: 112, bestseller: true },
        { sku: "RK-03", name: "Lunik Sky Sound Rocket", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 380, price: 152, featured: true },
        { sku: "RK-04", name: "2-Sound Whistle Rocket", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 450, price: 180 },
        { sku: "RK-05", name: "Parachute Rocket with Flare", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 620, price: 248, newArrival: true },
        { sku: "RK-06", name: "Multi-Colour Star Rocket", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 700, price: 280 },
        { sku: "RK-07", name: "Titan Space Shuttle Rocket", pack: "1 Box (3 Pcs)", unit: "Box", mrp: 980, price: 392, premium: true },
      ],
    },
    {
      catSlug: "multi-shot-and-night-shots",
      items: [
        { sku: "MS-01", name: "12-Shot Sky Symphony", pack: "1 Pcs", unit: "Pcs", mrp: 650, price: 260, bestseller: true },
        { sku: "MS-02", name: "25-Shot Silver Brocade", pack: "1 Pcs", unit: "Pcs", mrp: 1200, price: 480, bestseller: true },
        { sku: "MS-03", name: "30-Shot Multi-Color Aerial", pack: "1 Pcs", unit: "Pcs", mrp: 1500, price: 600, featured: true },
        { sku: "MS-04", name: "60-Shot Spectacular Fiesta", pack: "1 Pcs", unit: "Pcs", mrp: 2800, price: 1120, bestseller: true },
        { sku: "MS-05", name: "120-Shot Royal Celebration", pack: "1 Pcs", unit: "Pcs", mrp: 5500, price: 2200, premium: true },
        { sku: "MS-06", name: "240-Shot Mega Grand Finale", pack: "1 Pcs", unit: "Pcs", mrp: 10500, price: 4200, premium: true },
        { sku: "MS-07", name: "500-Shot Festival Extravaganza", pack: "1 Pcs", unit: "Pcs", mrp: 22000, price: 8800, premium: true },
      ],
    },
    {
      catSlug: "fancy-and-novelty",
      items: [
        { sku: "FN-01", name: "Dancing Peacock Fountain", pack: "1 Box (1 Pcs)", unit: "Box", mrp: 300, price: 120, bestseller: true },
        { sku: "FN-02", name: "Flying Butterfly (5 Pcs)", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 350, price: 140, bestseller: true },
        { sku: "FN-03", name: "Helicopter Whistling Toy", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 400, price: 160 },
        { sku: "FN-04", name: "Colour Smoke Grenade (3 Pcs)", pack: "1 Box (3 Pcs)", unit: "Box", mrp: 480, price: 192, newArrival: true },
        { sku: "FN-05", name: "Magic Pop Pop Snappers", pack: "1 Box (50 Pkts)", unit: "Box", mrp: 250, price: 100, bestseller: true },
        { sku: "FN-06", name: "Dragon Tail Flying Spinner", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 550, price: 220 },
        { sku: "FN-07", name: "Phoenix Sky Novelty", pack: "1 Box (2 Pcs)", unit: "Box", mrp: 850, price: 340, premium: true },
      ],
    },
    {
      catSlug: "twinkling-star-and-pencil",
      items: [
        { sku: "TS-01", name: "Twinkling Star Small 1.5ft", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 90, price: 36, bestseller: true },
        { sku: "TS-02", name: "Twinkling Star Jumbo 3ft", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 160, price: 64, bestseller: true },
        { sku: "TS-03", name: "Color Torch Pencil", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 220, price: 88, featured: true },
        { sku: "TS-04", name: "Whistling Wizard Pencil", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 320, price: 128 },
        { sku: "TS-05", name: "Bambara Twister Sticks", pack: "1 Box (10 Pcs)", unit: "Box", mrp: 280, price: 112 },
        { sku: "TS-06", name: "Super Star Candle 5ft", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 450, price: 180 },
        { sku: "TS-07", name: "Magic Laser Wand Deluxe", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 620, price: 248, premium: true },
      ],
    },
    {
      catSlug: "garlands",
      items: [
        { sku: "GL-01", name: "100 Wala Red Garland", pack: "1 Box", unit: "Box", mrp: 80, price: 32, bestseller: true },
        { sku: "GL-02", name: "200 Wala Red Garland", pack: "1 Box", unit: "Box", mrp: 160, price: 64, bestseller: true },
        { sku: "GL-03", name: "1,000 Wala Deluxe Garland", pack: "1 Box", unit: "Box", mrp: 750, price: 300, featured: true },
        { sku: "GL-04", name: "2,000 Wala Celebration Garland", pack: "1 Box", unit: "Box", mrp: 1500, price: 600, bestseller: true },
        { sku: "GL-05", name: "5,000 Wala Mega Festival Garland", pack: "1 Box", unit: "Box", mrp: 3800, price: 1520, premium: true },
        { sku: "GL-06", name: "10,000 Wala Royal Sivakasi Garland", pack: "1 Box", unit: "Box", mrp: 7800, price: 3120, premium: true },
        { sku: "GL-07", name: "Golden Star Sound Chain 1000", pack: "1 Box", unit: "Box", mrp: 950, price: 380 },
      ],
    },
    {
      catSlug: "gift-boxes",
      items: [
        { sku: "GB-01", name: "Mini Joy Box (15 Items)", pack: "1 Box", unit: "Box", mrp: 800, price: 320, bestseller: true },
        { sku: "GB-02", name: "Family Delight Box (25 Items)", pack: "1 Box", unit: "Box", mrp: 1600, price: 640, bestseller: true },
        { sku: "GB-03", name: "Festival Mega Box (35 Items)", pack: "1 Box", unit: "Box", mrp: 2800, price: 1120, featured: true },
        { sku: "GB-04", name: "Royal VIP Family Box (45 Items)", pack: "1 Box", unit: "Box", mrp: 4500, price: 1800, bestseller: true },
        { sku: "GB-05", name: "Corporate Elegance Box (55 Items)", pack: "1 Box", unit: "Box", mrp: 7500, price: 3000, premium: true },
        { sku: "GB-06", name: "Emperor Diamond Box (65 Items)", pack: "1 Box", unit: "Box", mrp: 11000, price: 4400, premium: true },
        { sku: "GB-07", name: "Maharaja Heritage Box (75 Items)", pack: "1 Box", unit: "Box", mrp: 16500, price: 6600, premium: true },
      ],
    },
    {
      catSlug: "kids-special",
      items: [
        { sku: "KD-01", name: "Cartoon Roll Caps (10 Rolls)", pack: "1 Box", unit: "Box", mrp: 60, price: 24, bestseller: true },
        { sku: "KD-02", name: "Serpent Black Cobra Eggs", pack: "1 Box (10 Pkts)", unit: "Box", mrp: 80, price: 32, bestseller: true },
        { sku: "KD-03", name: "Kid Safe Colour Matches", pack: "1 Box (10 Boxes)", unit: "Box", mrp: 120, price: 48, featured: true },
        { sku: "KD-04", name: "Magic Ring Gun + Caps Pack", pack: "1 Set", unit: "Set", mrp: 180, price: 72, bestseller: true },
        { sku: "KD-05", name: "Smiley Face Whistle Toy", pack: "1 Box (5 Pcs)", unit: "Box", mrp: 220, price: 88 },
        { sku: "KD-06", name: "Zero Smoke Sparkler Kit", pack: "1 Box (15 Pcs)", unit: "Box", mrp: 300, price: 120, newArrival: true },
        { sku: "KD-07", name: "Wonder Star Kid Pack", pack: "1 Kit (8 Varieties)", unit: "Kit", mrp: 480, price: 192, premium: true },
      ],
    },
  ];

  const allProductRecords: any[] = [];
  for (const group of productTemplates) {
    const categoryId = categoryMap.get(group.catSlug);
    if (!categoryId) continue;

    for (const item of group.items) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const mrpPaise = item.mrp * 100;
      const pricePaise = item.price * 100;

      const product = await prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          name: item.name,
          slug,
          categoryId,
          packSize: item.pack,
          unit: item.unit,
          mrpPaise,
          pricePaise,
          availability: StockStatus.IN_STOCK,
          isBestseller: !!item.bestseller,
          isFeatured: !!item.featured,
          isNewArrival: !!item.newArrival,
          isPremium: !!item.premium,
        },
        create: {
          sku: item.sku,
          name: item.name,
          slug,
          categoryId,
          packSize: item.pack,
          unit: item.unit,
          mrpPaise,
          pricePaise,
          availability: StockStatus.IN_STOCK,
          isBestseller: !!item.bestseller,
          isFeatured: !!item.featured,
          isNewArrival: !!item.newArrival,
          isPremium: !!item.premium,
          shortDesc: `Authentic Sivakasi ${item.name} with premium formulation and bright sparks.`,
          longDesc: `Manufactured in Sivakasi with stringent safety standards. Ideal for family Diwali celebrations. Pack contains ${item.pack}.`,
          specifications: [
            { label: "Origin", value: "Sivakasi, Tamil Nadu" },
            { label: "Pack Size", value: item.pack },
            { label: "Unit", value: item.unit },
            { label: "Safety Rating", value: "Verified Non-Toxic Formulation" },
          ],
        },
      });

      // SVG placeholder image
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/placeholders/${group.catSlug}.svg`,
          altText: item.name,
          sortOrder: 1,
          isPrimary: true,
        },
      });

      allProductRecords.push(product);
    }
  }
  console.log(`✅ ${allProductRecords.length} Products seeded with placeholder images.`);

  // 7. Seed 8 Combos with included items
  const combosData = [
    {
      name: "Diwali Sparkle Starter Pack",
      slug: "diwali-sparkle-starter-pack",
      desc: "Perfect pocket-friendly set for small families with sparkling favourites.",
      skus: ["SP-01", "FP-01", "GS-01", "KD-01"],
      comboRs: 120,
    },
    {
      name: "Family Celebration Combo",
      slug: "family-celebration-combo",
      desc: "Our most popular home pack featuring sparklers, pots, spinners and ground bombs.",
      skus: ["SP-02", "FP-02", "GS-02", "OS-02", "RK-01"],
      comboRs: 280,
    },
    {
      name: "Kids Joy Festival Hamper",
      slug: "kids-joy-festival-hamper",
      desc: "Child-safe, low-smoke assortment designed especially for younger children.",
      skus: ["KD-01", "KD-02", "KD-03", "KD-04", "TS-01"],
      comboRs: 180,
    },
    {
      name: "Night Sky Aerial Extravaganza",
      slug: "night-sky-aerial-extravaganza",
      desc: "Dazzling multi-color night sky repeaters and rockets.",
      skus: ["MS-01", "MS-02", "RK-02", "FT-01"],
      comboRs: 850,
    },
    {
      name: "Sivakasi Traditional Garland Blast",
      slug: "sivakasi-traditional-garland-blast",
      desc: "Classic high-decibel festival sounds with 100 wala to 1000 wala chains.",
      skus: ["GL-01", "GL-02", "GL-03", "OS-05"],
      comboRs: 420,
    },
    {
      name: "Mega Grand 60-Shot Aerial Combo",
      slug: "mega-grand-60-shot-aerial-combo",
      desc: "Spectacular 60-shot repeating cake combined with giant fountain pots.",
      skus: ["MS-04", "FP-04", "FT-04", "RK-03"],
      comboRs: 1550,
    },
    {
      name: "Royal Deluxe VIP Family Feast",
      slug: "royal-deluxe-vip-family-feast",
      desc: "The comprehensive celebration bundle packed with 25 distinct fireworks.",
      skus: ["GB-03", "MS-03", "FP-04", "GL-04", "SP-06"],
      comboRs: 3200,
    },
    {
      name: "Corporate Festival Gift Hamper",
      slug: "corporate-festival-gift-hamper",
      desc: "Premium gift box paired with aerial shots for corporate gifting.",
      skus: ["GB-05", "MS-02", "TS-03", "FP-03"],
      comboRs: 3800,
    },
  ];

  for (const comboItem of combosData) {
    const includedProducts = allProductRecords.filter((p) => comboItem.skus.includes(p.sku));
    const originalPaise = includedProducts.reduce((sum, p) => sum + p.pricePaise, 0);
    const comboPaise = comboItem.comboRs * 100;

    const combo = await prisma.combo.upsert({
      where: { slug: comboItem.slug },
      update: {
        name: comboItem.name,
        description: comboItem.desc,
        originalPaise,
        comboPaise,
        availability: StockStatus.IN_STOCK,
        isFeatured: true,
      },
      create: {
        name: comboItem.name,
        slug: comboItem.slug,
        description: comboItem.desc,
        originalPaise,
        comboPaise,
        availability: StockStatus.IN_STOCK,
        isFeatured: true,
        image: "/placeholders/gift-boxes.svg",
      },
    });

    await prisma.comboItem.deleteMany({ where: { comboId: combo.id } });
    for (const p of includedProducts) {
      await prisma.comboItem.create({
        data: {
          comboId: combo.id,
          productId: p.id,
          quantity: 1,
        },
      });
    }
  }
  console.log(`✅ 8 Combos seeded.`);

  // 8. Seed FAQs
  const faqsData = [
    {
      question: "How does the enquiry process work?",
      answer: "Browse our catalogue, add your chosen crackers and quantities to the enquiry list, select your delivery state, review your subtotal against the minimum order requirement, and submit your enquiry. You will receive an Enquiry Number immediately. Our Sivakasi team will contact you via WhatsApp or phone call to confirm product availability, logistics, and dispatch details.",
      category: "Ordering",
      sortOrder: 1,
    },
    {
      question: "Why is there no direct online payment or checkout?",
      answer: "In compliance with Indian legal regulations regarding fireworks transportation and seasonal availability, crackers cannot be sold via automatic online checkout. All enquiries are manually confirmed with customers to ensure legal transport feasibility and accurate batch availability.",
      category: "Legal & Payment",
      sortOrder: 2,
    },
    {
      question: "What is the minimum enquiry value?",
      answer: "For Tamil Nadu and Puducherry, the minimum enquiry value is ₹3,000. For all other states, the minimum order is ₹5,000. This ensures transport feasibility via approved Sivakasi cargo carriers.",
      category: "Delivery",
      sortOrder: 3,
    },
    {
      question: "How are crackers transported to my city?",
      answer: "Fireworks are dispatched via licensed surface transport carriers from Sivakasi to your city or nearest district logistics hub. You will be provided with the transporter name and LR (Lorry Receipt) tracking number once dispatched.",
      category: "Delivery",
      sortOrder: 4,
    },
    {
      question: "Are your crackers authentic Sivakasi make?",
      answer: "Yes, 100% of our products are directly sourced and packaged in Sivakasi, Tamil Nadu, adhering strictly to Indian Explosives Act safety norms.",
      category: "Quality",
      sortOrder: 5,
    },
  ];

  for (const faq of faqsData) {
    await prisma.faq.create({
      data: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sortOrder: faq.sortOrder,
        isActive: true,
      },
    });
  }
  console.log("✅ FAQs seeded.");

  // 9. Seed Sample Testimonials (Default INACTIVE as required)
  const testimonials = [
    {
      name: "Muruganathan S.",
      location: "Madurai, Tamil Nadu",
      content: "Excellent quality and timely delivery for our family Diwali celebration. The flower pots and sparklers were vibrant and long-lasting.",
      isActive: false, // Inactive as required by prompt
    },
    {
      name: "Rajesh Sharma",
      location: "Bengaluru, Karnataka",
      content: "Sample, replace before publishing. Direct Sivakasi pricing saved us over 40% compared to local retail stalls.",
      isActive: false,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({
      data: {
        name: t.name,
        location: t.location,
        content: t.content,
        isActive: t.isActive,
      },
    });
  }
  console.log("✅ Sample testimonials seeded as INACTIVE.");

  // 10. Seed Legal Pages (Markdown templates)
  const pages = [
    {
      slug: "terms",
      title: "Terms and Conditions",
      contentMd: `# Terms and Conditions\n\n*Business-provided content, please review.*\n\n1. **Enquiry Policy**: All submissions made on this platform are quotation enquiries and do not constitute a confirmed contract of sale until manually confirmed by our team.\n2. **Age Requirement**: You must be at least 18 years of age to submit an enquiry.\n3. **Compliance**: All dispatches follow Indian fireworks and transport regulations.`,
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      contentMd: `# Privacy Policy\n\n*Business-provided content, please review.*\n\nWe respect your privacy. Contact information provided during enquiry submission (name, mobile, delivery city) is strictly used for order estimation, logistics coordination, and direct communication regarding your enquiry. We never sell or share customer data.`,
    },
    {
      slug: "delivery-policy",
      title: "Delivery and Transport Policy",
      contentMd: `# Delivery and Transport Policy\n\n*Business-provided content, please review.*\n\nDue to regulations, fireworks cannot be shipped via courier or air. Dispatches are strictly made via surface cargo transport to the nearest district transport hub. Transporter receipt (LR copy) will be shared upon dispatch.`,
    },
    {
      slug: "safety",
      title: "Fireworks Safety Guidelines",
      contentMd: `# Fireworks Safety Guidelines\n\n*Business-provided content, please review.*\n\n- Always light fireworks outdoors under adult supervision.\n- Keep a bucket of water and sand nearby.\n- Wear cotton clothes while bursting crackers.\n- Maintain a safe distance of at least 5 metres after igniting.`,
    },
    {
      slug: "compliance",
      title: "Statutory Compliance Notice",
      contentMd: `# Statutory Compliance Notice\n\n*Business-provided content, please review.*\n\nIn accordance with Supreme Court directives and state government safety guidelines, this website operates strictly as an informative catalogue and estimation platform. No direct online transactions are processed.`,
    },
  ];

  for (const p of pages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, contentMd: p.contentMd },
      create: { slug: p.slug, title: p.title, contentMd: p.contentMd },
    });
  }
  console.log("✅ Legal and statutory pages seeded.");

  console.log("🎉 Database Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
