import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import fs from "fs";
import path from "path";

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
        phoneNumber: true,
        userName: true,
        displayName: true,
        bio: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
        whatsup: true,
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

    const {
      name,
      avatar,
      phoneNumber,
      userName,
      displayName,
      bio,
      location,
      website,
      linkedin,
      github,
      whatsup,
    } = req.body;

    // Zoznam povolených polí a ich hodnôt
    const allowedFields = {
      name,
      avatar,
      phoneNumber,
      userName,
      displayName,
      bio,
      location,
      website,
      linkedin,
      github,
      whatsup,
    };

    // Validácia - všetky polia musia byť string alebo null
    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined && value !== null && typeof value !== "string") {
        return res.status(400).json({ error: `${key} must be a string or null` });
      }
    }

    // Priprav dáta na update - aktualizuj iba polia, ktoré boli poslané
    const updateData: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
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
        phoneNumber: true,
        userName: true,
        displayName: true,
        bio: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
        whatsup: true,
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

// POST /api/user/avatar - nahrá novú profilovú fotku
router.post(
  "/avatar",
  authenticateToken,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Získaj starý avatar pre prípadné vymazanie
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { avatar: true },
      });

      // Vymaž starý lokálny avatar ak existuje
      if (currentUser?.avatar?.startsWith("/uploads/avatars/")) {
        const oldPath = path.join(process.cwd(), currentUser.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Ulož cestu k novému avataru
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          provider: true,
          phoneNumber: true,
          userName: true,
          displayName: true,
          bio: true,
          location: true,
          website: true,
          linkedin: true,
          github: true,
          whatsup: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  }
);

export default router;
