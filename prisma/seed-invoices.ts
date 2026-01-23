import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Nájdi Jaro používateľa
  const jaro = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: "jarocha75" } },
        { email: { contains: "jaro" } },
        { name: { contains: "Jaro" } },
      ],
    },
  });

  // Nájdi Peter používateľa
  const peter = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: "peter.novak" } },
        { email: { contains: "peter" } },
        { name: { contains: "Peter" } },
      ],
    },
  });

  if (!jaro && !peter) {
    console.log("❌ Ani Jaro ani Peter neboli nájdení v databáze.");
    console.log("📋 Dostupní používatelia:");
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    allUsers.forEach((u) => {
      console.log(`   ID: ${u.id}, Email: ${u.email}, Meno: ${u.name}`);
    });
    return;
  }

  // Faktúry pre Jaro
  if (jaro) {
    console.log(`✅ Našiel som Jaro: ${jaro.email} (ID: ${jaro.id})`);

    // Zmaž staré faktúry
    await prisma.invoice.deleteMany({
      where: { userId: jaro.id },
    });
    console.log("🗑️  Zmazané staré faktúry pre Jaro\n");

    const jaroInvoices = [
      {
        invoiceNumber: "INV-2025-001",
        clientName: "Tech Solutions Ltd.",
        clientEmail: "john.smith@techsolutions.com",
        amount: 1500.0,
        status: "paid",
        dueDate: new Date("2025-02-15"),
        description: "Web development services - January",
        userId: jaro.id,
      },
      {
        invoiceNumber: "INV-2025-002",
        clientName: "Design Studio Pro",
        clientEmail: "maria@designstudio.com",
        amount: 850.0,
        status: "sent",
        dueDate: new Date("2025-02-28"),
        description: "Frontend implementation for e-commerce site",
        userId: jaro.id,
      },
      {
        invoiceNumber: "INV-2025-003",
        clientName: "StartUp Innovation s.r.o.",
        clientEmail: "info@startupinnovation.sk",
        amount: 2200.0,
        status: "draft",
        dueDate: new Date("2025-03-10"),
        description: "Mobile app development - Phase 1",
        userId: jaro.id,
      },
      {
        invoiceNumber: "INV-2024-045",
        clientName: "Marketing Agency Plus",
        clientEmail: "billing@marketingplus.com",
        amount: 650.0,
        status: "paid",
        dueDate: new Date("2024-12-20"),
        description: "Landing page design and development",
        userId: jaro.id,
      },
      {
        invoiceNumber: "INV-2025-004",
        clientName: "Engineering GmbH",
        clientEmail: "h.mueller@engineering.de",
        amount: 3500.0,
        status: "sent",
        dueDate: new Date("2025-03-01"),
        description: "API integration and backend services",
        userId: jaro.id,
      },
      {
        invoiceNumber: "INV-2024-042",
        clientName: "Local Business s.r.o.",
        clientEmail: "kontakt@localbusiness.sk",
        amount: 400.0,
        status: "cancelled",
        dueDate: new Date("2024-11-30"),
        description: "Website maintenance - cancelled by client",
        userId: jaro.id,
      },
    ];

    console.log("🌱 Vytvárám faktúry pre Jaro...\n");

    for (const inv of jaroInvoices) {
      const created = await prisma.invoice.create({
        data: inv,
      });
      const statusIcon =
        created.status === "paid"
          ? "✅"
          : created.status === "sent"
            ? "📤"
            : created.status === "cancelled"
              ? "❌"
              : "📝";
      console.log(
        `${statusIcon} ${created.invoiceNumber}: ${created.amount}€ - ${created.clientName} (${created.status})`
      );
    }

    console.log(`\n✨ Vytvorených ${jaroInvoices.length} faktúr pre Jaro!\n`);
  }

  // Faktúry pre Peter
  if (peter) {
    console.log(`✅ Našiel som Petra: ${peter.email} (ID: ${peter.id})`);

    // Zmaž staré faktúry
    await prisma.invoice.deleteMany({
      where: { userId: peter.id },
    });
    console.log("🗑️  Zmazané staré faktúry pre Petra\n");

    const peterInvoices = [
      {
        invoiceNumber: "INV-2025-P001",
        clientName: "Consulting Partners a.s.",
        clientEmail: "finance@consultingpartners.sk",
        amount: 4200.0,
        status: "paid",
        dueDate: new Date("2025-01-31"),
        description: "IT consulting services - Q4 2024",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2025-P002",
        clientName: "E-commerce Solutions Ltd.",
        clientEmail: "orders@ecommercesolutions.com",
        amount: 1800.0,
        status: "sent",
        dueDate: new Date("2025-02-20"),
        description: "Database optimization and migration",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2025-P003",
        clientName: "Healthcare Systems s.r.o.",
        clientEmail: "it@healthcaresystems.sk",
        amount: 5500.0,
        status: "draft",
        dueDate: new Date("2025-03-15"),
        description: "Security audit and implementation",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2025-P004",
        clientName: "Finance Pro Group",
        clientEmail: "accounting@financeprogroup.com",
        amount: 950.0,
        status: "paid",
        dueDate: new Date("2025-02-05"),
        description: "Custom reporting dashboard",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2024-P089",
        clientName: "Retail Chain s.r.o.",
        clientEmail: "tech@retailchain.sk",
        amount: 2750.0,
        status: "paid",
        dueDate: new Date("2024-12-15"),
        description: "POS system integration",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2025-P005",
        clientName: "Logistics Express",
        clientEmail: "support@logisticsexpress.com",
        amount: 1200.0,
        status: "sent",
        dueDate: new Date("2025-02-28"),
        description: "Tracking system enhancements",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2025-P006",
        clientName: "Education Platform a.s.",
        clientEmail: "billing@eduplatform.sk",
        amount: 3200.0,
        status: "draft",
        dueDate: new Date("2025-03-20"),
        description: "E-learning module development",
        userId: peter.id,
      },
      {
        invoiceNumber: "INV-2024-P085",
        clientName: "Small Business Co.",
        clientEmail: "owner@smallbusiness.sk",
        amount: 350.0,
        status: "cancelled",
        dueDate: new Date("2024-11-20"),
        description: "Website updates - project cancelled",
        userId: peter.id,
      },
    ];

    console.log("🌱 Vytvárám faktúry pre Petra...\n");

    for (const inv of peterInvoices) {
      const created = await prisma.invoice.create({
        data: inv,
      });
      const statusIcon =
        created.status === "paid"
          ? "✅"
          : created.status === "sent"
            ? "📤"
            : created.status === "cancelled"
              ? "❌"
              : "📝";
      console.log(
        `${statusIcon} ${created.invoiceNumber}: ${created.amount}€ - ${created.clientName} (${created.status})`
      );
    }

    console.log(`\n✨ Vytvorených ${peterInvoices.length} faktúr pre Petra!`);
  }

  console.log("\n🎉 Seed faktúr dokončený!");
}

main()
  .catch((e) => {
    console.error("❌ Chyba pri seedovaní:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
