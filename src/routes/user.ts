import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// GET /api/user/profile - získa profil aktuálneho používateľa
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// PUT /api/user/profile - aktualizuje profil aktuálneho používateľa
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, avatar } = req.body;

    // Validácia vstupných dát
    if (name !== undefined && typeof name !== "string") {
      return res.status(400).json({ error: "Name must be a string" });
    }

    if (avatar !== undefined && typeof avatar !== "string") {
      return res.status(400).json({ error: "Avatar must be a string" });
    }

    // Priprav dáta na update - aktualizuj iba polia, ktoré boli poslané
    const updateData: { name?: string; avatar?: string } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Ak nie sú žiadne dáta na update, vráť chybu
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No data to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
