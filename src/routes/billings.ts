import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

// GET /api/billings - Získať všetky klientske záznamy používateľa
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const billings = await prisma.billing.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(billings);
  } catch (error) {
    console.error("Get billings error:", error);
    res.status(500).json({
      error: "Failed to fetch billings",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/billings/:id - Získať konkrétny klientsky záznam
router.get("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const billing = await prisma.billing.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!billing) {
      return res.status(404).json({ error: "Billing not found" });
    }

    res.json(billing);
  } catch (error) {
    console.error("Get billing error:", error);
    res.status(500).json({
      error: "Failed to fetch billing",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/billings - Vytvoriť nový klientsky záznam
router.post("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fullName, company, email, vatNumber } = req.body;

    // Validácia
    if (!fullName || !company || !email || !vatNumber) {
      return res.status(400).json({
        error: "Missing required fields: fullName, company, email, vatNumber",
      });
    }

    const billing = await prisma.billing.create({
      data: {
        fullName,
        company,
        email,
        vatNumber,
        userId: req.userId,
      },
    });

    res.status(201).json(billing);
  } catch (error) {
    console.error("Create billing error:", error);
    res.status(500).json({
      error: "Failed to create billing",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/billings/:id - Aktualizovať klientsky záznam
router.put("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { fullName, company, email, vatNumber } = req.body;

    // Overiť, že záznam patrí používateľovi
    const existingBilling = await prisma.billing.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingBilling) {
      return res.status(404).json({ error: "Billing not found" });
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (company !== undefined) updateData.company = company;
    if (email !== undefined) updateData.email = email;
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber;

    const billing = await prisma.billing.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });

    res.json(billing);
  } catch (error) {
    console.error("Update billing error:", error);
    res.status(500).json({
      error: "Failed to update billing",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/billings/:id - Zmazať klientsky záznam
router.delete("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Overiť, že záznam patrí používateľovi
    const existingBilling = await prisma.billing.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingBilling) {
      return res.status(404).json({ error: "Billing not found" });
    }

    await prisma.billing.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({ message: "Billing deleted successfully" });
  } catch (error) {
    console.error("Delete billing error:", error);
    res.status(500).json({
      error: "Failed to delete billing",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
