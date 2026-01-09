import axios from "axios";

const API_URL = "http://localhost:4000/api";

async function testPeterNovakBillings() {
  try {
    console.log("🔐 1. Prihlasovanie používateľa peter.novak...\n");

    // 1. Prihlásenie
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: "peter.novak@gmail.com",
      password: "Peter123.",
    });

    const { accessToken, refreshToken, user } = loginResponse.data;

    console.log("✅ Prihlásenie úspešné!");
    console.log("   User ID:", user.id);
    console.log("   Email:", user.email);
    console.log("   Access Token:", accessToken.substring(0, 20) + "...");
    console.log("");

    // 2. Načítanie /me endpointu
    console.log("👤 2. Načítavam /me endpoint...\n");
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("✅ /me endpoint:");
    console.log("   Response:", JSON.stringify(meResponse.data, null, 2));
    console.log("");

    // 3. Načítanie billings
    console.log("💰 3. Načítavam billings...\n");
    const billingsResponse = await axios.get(`${API_URL}/billings`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("✅ Billings načítané úspešne!");
    console.log(`   Počet záznamov: ${billingsResponse.data.length}`);
    console.log("");
    console.log("📋 Zoznam billings:");
    billingsResponse.data.forEach((billing, index) => {
      console.log(`   ${index + 1}. ${billing.fullName} - ${billing.company}`);
      console.log(`      Email: ${billing.email}`);
      console.log(`      VAT: ${billing.vatNumber}`);
      console.log(`      User ID: ${billing.userId}`);
      console.log("");
    });

    console.log("🎉 Všetko funguje správne!");

  } catch (error) {
    console.error("❌ CHYBA:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error("\n⚠️  Autentifikácia zlyhala:");
      console.error("   - Skontroluj heslo používateľa");
      console.error("   - Skontroluj JWT_SECRET v .env súbore");
      console.error("   - Skontroluj, či backend beží");
    } else if (error.response?.status === 404) {
      console.error("\n⚠️  Endpoint nebol nájdený:");
      console.error("   - Skontroluj, či je backend správne nakonfigurovaný");
      console.error("   - Skontroluj URL:", API_URL);
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n⚠️  Nemôžem sa pripojiť k serveru:");
      console.error("   - Je backend spustený?");
      console.error("   - Beží na porte 3001?");
    }
  }
}

testPeterNovakBillings();
