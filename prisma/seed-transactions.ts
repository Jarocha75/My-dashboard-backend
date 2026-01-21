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

  // Transakcie pre Jaro
  if (jaro) {
    console.log(`✅ Našiel som Jaro: ${jaro.email} (ID: ${jaro.id})`);

    // Zmaž staré transakcie
    await prisma.transaction.deleteMany({
      where: { userId: jaro.id },
    });
    console.log("🗑️  Zmazané staré transakcie pre Jaro\n");

    const jaroTransactions = [
      {
        amount: 2500.0,
        type: "income",
        category: "Salary",
        description: "Monthly salary - January",
        date: new Date("2025-01-15"),
        userId: jaro.id,
      },
      {
        amount: 850.0,
        type: "income",
        category: "Freelance",
        description: "Web development project for client",
        date: new Date("2025-01-20"),
        userId: jaro.id,
      },
      {
        amount: 120.5,
        type: "expense",
        category: "Groceries",
        description: "Weekly shopping at Lidl",
        date: new Date("2025-01-18"),
        userId: jaro.id,
      },
      {
        amount: 45.0,
        type: "expense",
        category: "Transport",
        description: "Monthly bus pass",
        date: new Date("2025-01-02"),
        userId: jaro.id,
      },
      {
        amount: 199.99,
        type: "expense",
        category: "Electronics",
        description: "New Sony headphones",
        date: new Date("2025-01-10"),
        userId: jaro.id,
      },
      {
        amount: 500.0,
        type: "income",
        category: "Bonus",
        description: "Christmas bonus",
        date: new Date("2024-12-20"),
        userId: jaro.id,
      },
      {
        amount: 89.0,
        type: "expense",
        category: "Entertainment",
        description: "Netflix and Spotify subscription",
        date: new Date("2025-01-01"),
        userId: jaro.id,
      },
      {
        amount: 350.0,
        type: "expense",
        category: "Housing",
        description: "Electricity bill - January",
        date: new Date("2025-01-25"),
        userId: jaro.id,
      },
    ];

    console.log("🌱 Vytvárám transakcie pre Jaro...\n");

    for (const tx of jaroTransactions) {
      const created = await prisma.transaction.create({
        data: tx,
      });
      const icon = created.type === "income" ? "💰" : "💸";
      console.log(
        `${icon} ${created.type.toUpperCase()}: ${created.amount}€ - ${created.category} (${created.description})`
      );
    }

    console.log(
      `\n✨ Vytvorených ${jaroTransactions.length} transakcií pre Jaro!\n`
    );
  }

  // Transakcie pre Peter
  if (peter) {
    console.log(`✅ Našiel som Petra: ${peter.email} (ID: ${peter.id})`);

    // Zmaž staré transakcie
    await prisma.transaction.deleteMany({
      where: { userId: peter.id },
    });
    console.log("🗑️  Zmazané staré transakcie pre Petra\n");

    const peterTransactions = [
      {
        amount: 3200.0,
        type: "income",
        category: "Salary",
        description: "Monthly salary - January",
        date: new Date("2025-01-15"),
        userId: peter.id,
      },
      {
        amount: 1500.0,
        type: "income",
        category: "Investments",
        description: "Stock dividends",
        date: new Date("2025-01-22"),
        userId: peter.id,
      },
      {
        amount: 450.0,
        type: "expense",
        category: "Car",
        description: "Car service - oil and filter change",
        date: new Date("2025-01-12"),
        userId: peter.id,
      },
      {
        amount: 89.99,
        type: "expense",
        category: "Groceries",
        description: "Shopping at Tesco",
        date: new Date("2025-01-19"),
        userId: peter.id,
      },
      {
        amount: 250.0,
        type: "expense",
        category: "Sports",
        description: "Annual gym membership",
        date: new Date("2025-01-05"),
        userId: peter.id,
      },
      {
        amount: 780.0,
        type: "income",
        category: "Freelance",
        description: "Consulting for startup",
        date: new Date("2025-01-28"),
        userId: peter.id,
      },
      {
        amount: 65.0,
        type: "expense",
        category: "Entertainment",
        description: "Cinema and dinner with family",
        date: new Date("2025-01-14"),
        userId: peter.id,
      },
      {
        amount: 1200.0,
        type: "expense",
        category: "Housing",
        description: "Rent - January",
        date: new Date("2025-01-01"),
        userId: peter.id,
      },
      {
        amount: 35.5,
        type: "expense",
        category: "Health",
        description: "Pharmacy medicines",
        date: new Date("2025-01-08"),
        userId: peter.id,
      },
      {
        amount: 200.0,
        type: "income",
        category: "Other",
        description: "Sold old monitor",
        date: new Date("2025-01-16"),
        userId: peter.id,
      },
    ];

    console.log("🌱 Vytvárám transakcie pre Petra...\n");

    for (const tx of peterTransactions) {
      const created = await prisma.transaction.create({
        data: tx,
      });
      const icon = created.type === "income" ? "💰" : "💸";
      console.log(
        `${icon} ${created.type.toUpperCase()}: ${created.amount}€ - ${created.category} (${created.description})`
      );
    }

    console.log(
      `\n✨ Vytvorených ${peterTransactions.length} transakcií pre Petra!`
    );
  }

  console.log("\n🎉 Seed transakcií dokončený!");
}

main()
  .catch((e) => {
    console.error("❌ Chyba pri seedovaní:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
