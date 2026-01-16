import { Router } from "express";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Všetky routes sú chránené authentikáciou
router.use(authenticateToken);

// GET /api/search?q=query - Univerzálne vyhľadávanie
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = q.trim();

    // Paralelné vyhľadávanie vo všetkých entitách
    const [users, dashboards, billings] = await Promise.all([
      // Vyhľadávanie používateľov (bez hesla)
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { displayName: { contains: searchTerm } },
            { userName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { bio: { contains: searchTerm } },
            { location: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          userName: true,
          avatar: true,
          bio: true,
          location: true,
          createdAt: true,
        },
        take: 10,
      }),

      // Vyhľadávanie dashboardov (len vlastné)
      prisma.dashboard.findMany({
        where: {
          userId: req.userId,
          title: { contains: searchTerm },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // Vyhľadávanie billings (len vlastné)
      prisma.billing.findMany({
        where: {
          userId: req.userId,
          OR: [
            { fullName: { contains: searchTerm } },
            { company: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { vatNumber: { contains: searchTerm } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Formátovanie avatárov s BASE_URL
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    const formattedUsers = users.map((user) => ({
      ...user,
      avatar: user.avatar ? `${baseUrl}${user.avatar}` : null,
    }));

    res.json({
      query: searchTerm,
      results: {
        users: formattedUsers,
        dashboards,
        billings,
      },
      counts: {
        users: users.length,
        dashboards: dashboards.length,
        billings: billings.length,
        total: users.length + dashboards.length + billings.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
