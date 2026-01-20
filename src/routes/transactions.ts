import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

// GET /api/transactions - Získať všetky transakcie používateľa
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      error: "Failed to fetch transactions",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/transactions/:id - Získať konkrétnu transakciu
router.get("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      error: "Failed to fetch transaction",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/transactions - Vytvoriť novú transakciu
router.post("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { amount, type, category, description, date } = req.body;

    // Validácia
    if (amount === undefined || !type) {
      return res.status(400).json({
        error: "Missing required fields: amount, type",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        error: "Type must be 'income' or 'expense'",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId: req.userId,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      error: "Failed to create transaction",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/transactions/:id - Aktualizovať transakciu
router.put("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { amount, type, category, description, date } = req.body;

    // Overiť, že záznam patrí používateľovi
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        error: "Type must be 'income' or 'expense'",
      });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);

    const transaction = await prisma.transaction.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });

    res.json(transaction);
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({
      error: "Failed to update transaction",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/transactions/:id - Zmazať transakciu
router.delete("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Overiť, že záznam patrí používateľovi
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.transaction.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      error: "Failed to delete transaction",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
