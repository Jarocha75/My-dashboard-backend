import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

/**
 * GET /api/payment-method
 * Získať všetky platobné karty používateľa
 */
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(paymentMethods);
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({
      error: "Failed to fetch payment methods",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/payment-method
 * Pridať novú platobnú kartu (Stripe PaymentMethod)
 */
router.post("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let { paymentMethodId, cardBrand, brand, type } = req.body;

    // Pre vývoj: ak nie je paymentMethodId, vytvor testovaciu kartu
    if (!paymentMethodId) {
      const testTokens: Record<string, string> = {
        visa: "tok_visa",
        mastercard: "tok_mastercard",
        amex: "tok_amex",
        discover: "tok_discover",
        diners: "tok_diners",
        jcb: "tok_jcb",
        unionpay: "tok_unionpay",
      };

      // Akceptuj cardBrand, brand alebo type
      const selectedBrand = cardBrand || brand || type;
      const token = testTokens[selectedBrand?.toLowerCase()] || "tok_visa";

      const testPaymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token },
      });
      paymentMethodId = testPaymentMethod.id;
    }

    // Získať kartu zo Stripe
    const stripePaymentMethod =
      await stripe.paymentMethods.retrieve(paymentMethodId);

    if (stripePaymentMethod.type !== "card" || !stripePaymentMethod.card) {
      return res.status(400).json({
        error: "Provided payment method is not a card",
      });
    }

    const card = stripePaymentMethod.card;

    // Získať alebo vytvoriť Stripe customera pre používateľa
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hľadať existujúceho Stripe customera alebo vytvoriť nového
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    const existingCustomer = customers.data[0];
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        ...(user.name && { name: user.name }),
      });
      customerId = newCustomer.id;
    }

    // Attachnúť payment method k customerovi
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Zistiť či už používateľ má nejakú platobnú metódu
    const existingMethods = await prisma.paymentMethod.count({
      where: { userId: req.userId },
    });

    // Uložiť len bezpečné údaje
    const savedPaymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: req.userId,
        type: card.brand,
        brand: card.brand,
        last4: card.last4,
        provider: "stripe",
        providerMethodId: stripePaymentMethod.id,
        isDefault: existingMethods === 0, // Prvá metóda je automaticky default
      },
    });

    res.status(201).json(savedPaymentMethod);
  } catch (error) {
    console.error("Create payment method error:", error);
    res.status(500).json({
      error: "Failed to create payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/payment-method/:id
 * Odstrániť platobnú kartu
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid payment method ID" });
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: parsedId,
        userId: req.userId,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    // (voliteľné) detach zo Stripe
    try {
      await stripe.paymentMethods.detach(paymentMethod.providerMethodId);
    } catch (stripeError) {
      console.warn("Stripe detach warning:", stripeError);
    }

    await prisma.paymentMethod.delete({
      where: {
        id: parsedId,
      },
    });

    res.json({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({
      error: "Failed to delete payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PATCH /api/payment-method/:id/default
 * Nastaviť platobnú metódu ako predvolenú
 */
router.patch("/:id/default", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid payment method ID" });
    }

    // Overiť že platobná metóda patrí používateľovi
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: parsedId,
        userId: req.userId,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    // Transakcia: zrušiť default na všetkých a nastaviť na vybranej
    await prisma.$transaction([
      prisma.paymentMethod.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      }),
      prisma.paymentMethod.update({
        where: { id: parsedId },
        data: { isDefault: true },
      }),
    ]);

    const updatedMethod = await prisma.paymentMethod.findUnique({
      where: { id: parsedId },
    });

    res.json(updatedMethod);
  } catch (error) {
    console.error("Set default payment method error:", error);
    res.status(500).json({
      error: "Failed to set default payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
