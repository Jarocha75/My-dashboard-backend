import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

// Helper funkcia na transformáciu transakcie z DB formátu na API formát
const transformTransaction = (tx: {
  id: number;
  amount: any;
  type: string;
  category: string | null;
  description: string | null;
  date: Date;
}) => ({
  id: String(tx.id),
  name: tx.category || "Transakcia",
  ISO: tx.date.toISOString(),
  amount: Number(tx.amount),
  type: tx.type === "income" ? "deposit" : tx.type === "expense" ? "charge" : "pending",
  description: tx.description || undefined,
  category: tx.category || undefined,
});

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

    res.json(transactions.map(transformTransaction));
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

    res.json(transformTransaction(transaction));
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

    const { amount, type, name, category, description, ISO } = req.body;

    // Validácia
    if (amount === undefined || !type) {
      return res.status(400).json({
        error: "Missing required fields: amount, type",
      });
    }

    if (!["deposit", "charge", "pending"].includes(type)) {
      return res.status(400).json({
        error: "Type must be 'deposit', 'charge' or 'pending'",
      });
    }

    // Transformácia z API formátu na DB formát
    const dbType = type === "deposit" ? "income" : type === "charge" ? "expense" : "pending";

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: dbType,
        category: category || name,
        description,
        date: ISO ? new Date(ISO) : new Date(),
        userId: req.userId,
      },
    });

    res.status(201).json(transformTransaction(transaction));
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
    const { amount, type, name, category, description, ISO } = req.body;

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

    if (type && !["deposit", "charge", "pending"].includes(type)) {
      return res.status(400).json({
        error: "Type must be 'deposit', 'charge' or 'pending'",
      });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (type !== undefined) updateData.type = type === "deposit" ? "income" : type === "charge" ? "expense" : "pending";
    if (name !== undefined) updateData.category = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (ISO !== undefined) updateData.date = new Date(ISO);

    const transaction = await prisma.transaction.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });

    res.json(transformTransaction(transaction));
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
