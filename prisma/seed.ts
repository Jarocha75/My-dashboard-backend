import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Nájdi prvého používateľa v databáze
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("❌ Žiadny používateľ v databáze. Najprv sa prihlás do aplikácie.");
    return;
  }

  console.log(`✅ Našiel som používateľa: ${user.email} (ID: ${user.id})`);

  // Zmaž staré billings pre tohto používateľa
  await prisma.billing.deleteMany({
    where: { userId: user.id },
  });
  console.log("🗑️  Zmazané staré fakturačné údaje\n");

  // Vytvor testovacie fakturačné údaje klientov
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
    {
      fullName: "Sophie Laurent",
      company: "Consulting Partners",
      email: "sophie@consulting.fr",
      vatNumber: "FR789123456",
      userId: user.id,
    },
    {
      fullName: "Marco Rossi",
      company: "Italian Imports",
      email: "marco.rossi@imports.it",
      vatNumber: "IT321654987",
      userId: user.id,
    },
  ];

  console.log("\n🌱 Vytvárám testovacie fakturačné údaje...\n");

  for (const billing of billings) {
    const created = await prisma.billing.create({
      data: billing,
    });
    console.log(`✅ ${created.fullName} - ${created.company} (${created.email})`);
  }

  console.log(`\n✨ Úspešne vytvorených ${billings.length} fakturačných údajov!`);
}

main()
  .catch((e) => {
    console.error("❌ Chyba pri seedovaní:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
