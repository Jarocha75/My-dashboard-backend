import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Nájdi Jaro používateľa
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: "jarocha75" } },
        { email: { contains: "jaro" } },
        { name: { contains: "Jaro" } },
      ],
    },
  });

  if (!user) {
    console.log("❌ Používateľ jarocha75 nebol nájdený v databáze.");
    console.log("📋 Dostupní používatelia:");
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    allUsers.forEach((u) => {
      console.log(`   ID: ${u.id}, Email: ${u.email}, Meno: ${u.name}`);
    });
    return;
  }

  console.log(`✅ Našiel som používateľa: ${user.email} (ID: ${user.id})`);

  // Zmaž staré billings pre tohto používateľa
  await prisma.billing.deleteMany({
    where: { userId: user.id },
  });
  console.log("🗑️  Zmazané staré fakturačné údaje\n");

  // Vytvor nové billings pre Jaro
  const billings = [
    {
      fullName: "John Smith",
      company: "Tech Solutions Ltd.",
      email: "john.smith@techsolutions.com",
      vatNumber: "GB123456789",
      userId: user.id,
    },
    {
      fullName: "Maria Garcia",
      company: "Design Studio Pro",
      email: "maria@designstudio.com",
      vatNumber: "ES987654321",
      userId: user.id,
    },
    {
      fullName: "Hans Mueller",
      company: "Engineering GmbH",
      email: "h.mueller@engineering.de",
      vatNumber: "DE456789123",
      userId: user.id,
    },
  ];

  console.log("🌱 Vytvárám nové billing záznamy pre Jaro...\n");

  for (const billing of billings) {
    const created = await prisma.billing.create({
      data: billing,
    });
    console.log(
      `✅ ${created.fullName} - ${created.company} (${created.email})`
    );
  }

  console.log(
    `\n✨ Úspešne vytvorených ${billings.length} fakturačných údajov pre ${user.email}!`
  );
}

main()
  .catch((e) => {
    console.error("❌ Chyba pri seedovaní:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
