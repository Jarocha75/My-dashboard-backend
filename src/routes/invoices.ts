import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

// GET /api/invoices - Získať všetky faktúry používateľa
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      error: "Failed to fetch invoices",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/invoices/:id - Získať konkrétnu faktúru
router.get("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({
      error: "Failed to fetch invoice",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/invoices - Vytvoriť novú faktúru
router.post("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { invoiceNumber, clientName, clientEmail, amount, status, dueDate, description } = req.body;

    // Validácia
    if (!invoiceNumber || !clientName || amount === undefined) {
      return res.status(400).json({
        error: "Missing required fields: invoiceNumber, clientName, amount",
      });
    }

    const validStatuses = ["draft", "sent", "paid", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Status must be one of: draft, sent, paid, cancelled",
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        clientEmail,
        amount,
        status: status || "draft",
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        userId: req.userId,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/invoices/:id - Aktualizovať faktúru
router.put("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { invoiceNumber, clientName, clientEmail, amount, status, dueDate, description } = req.body;

    // Overiť, že záznam patrí používateľovi
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const validStatuses = ["draft", "sent", "paid", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Status must be one of: draft, sent, paid, cancelled",
      });
    }

    const updateData: any = {};
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (amount !== undefined) updateData.amount = amount;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (description !== undefined) updateData.description = description;

    const invoice = await prisma.invoice.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });

    res.json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({
      error: "Failed to update invoice",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/invoices/:id - Zmazať faktúru
router.delete("/:id", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Overiť, že záznam patrí používateľovi
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await prisma.invoice.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({
      error: "Failed to delete invoice",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
