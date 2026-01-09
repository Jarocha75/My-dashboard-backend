import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Nájdi peter.novak používateľa
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: "peter.novak" } },
        { email: { contains: "peter" } },
        { name: { contains: "Peter Novak" } },
      ],
    },
  });

  if (!user) {
    console.log("❌ Používateľ peter.novak nebol nájdený v databáze.");
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
  console.log("🗑️  Zmazané staré faktúry\n");

  // Vytvor nové billings pre Peter Novak
  const billings = [
    {
      fullName: "Oliver Liam",
      company: "Viking Burrito",
      email: "oliver@burrito.com",
      vatNumber: "FRB123456",
      userId: user.id,
    },
    {
      fullName: "Jaroslav Pecha",
      company: "Commando Company",
      email: "jarocha75@gmail.com",
      vatNumber: "FRB234567",
      userId: user.id,
    },
    {
      fullName: "Peter Novak",
      company: "Dummy Company",
      email: "peter.novak@gmail.com",
      vatNumber: "FRB765432",
      userId: user.id,
    },
  ];

  console.log("🌱 Vytvárám nové billing záznamy pre Peter Novak...\n");

  for (const billing of billings) {
    const created = await prisma.billing.create({
      data: billing,
    });
    console.log(
      `✅ ${created.fullName} - ${created.company} (${created.email})`
    );
  }

  console.log(
    `\n✨ Úspešne vytvorených ${billings.length} faktúr pre ${user.email}!`
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
