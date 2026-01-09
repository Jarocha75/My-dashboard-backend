import { Router } from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../prisma/client.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "../utils/tokens.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: "local",
      },
    });

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user registered with Google/Facebook
    if (user.provider !== "local") {
      return res.status(400).json({
        error: `This email is registered with ${user.provider}. Please use ${user.provider} login.`
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

    let payload;

    // Try to verify as ID token first (JWT format)
    if (googleToken.split('.').length === 3) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: googleToken,
          audience: process.env.GOOGLE_CLIENT_ID!,
        });
        payload = ticket.getPayload();
      } catch (error) {
        console.log("Not a valid ID token, trying as access token");
      }
    }

    // If not an ID token, use it as access token to get user info
    if (!payload) {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${googleToken}`,
          },
        }
      );

      payload = {
        sub: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
      };
    }

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            provider: "google",
            providerId: payload.sub,
          },
          {
            email: payload.email,
          },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || null,
          avatar: payload.picture || null,
          provider: "google",
          providerId: payload.sub,
        },
      });
    } else if (!user.providerId || user.provider !== "google") {
      // Link Google account to existing email
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          providerId: payload.sub,
          provider: "google",
          name: payload.name || user.name,
          avatar: payload.picture || user.avatar,
        },
      });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      error: "Google authentication failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Facebook Login endpoint
router.post("/facebook", async (req, res) => {
  try {
    const { token: facebookToken } = req.body;

    if (!facebookToken) {
      return res.status(400).json({ error: "Facebook token is required" });
    }

    // Verify Facebook token with Facebook Graph API
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookToken}`
    );

    const { id: facebookId, name, email, picture } = fbResponse.data;

    if (!email) {
      return res.status(400).json({
        error: "Email permission required from Facebook"
      });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            provider: "facebook",
            providerId: facebookId,
          },
          {
            email: email,
          },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar: picture?.data?.url || null,
          provider: "facebook",
          providerId: facebookId,
        },
      });
    } else if (!user.providerId || user.provider !== "facebook") {
      // Link Facebook account to existing email
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          providerId: facebookId,
          provider: "facebook",
          name: name || user.name,
          avatar: picture?.data?.url || user.avatar,
        },
      });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    // Return user data
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Facebook login error:", error);

    if (axios.isAxiosError(error)) {
      return res.status(401).json({
        error: "Facebook authentication failed",
        details: error.response?.data?.error?.message || "Invalid Facebook token",
      });
    }

    res.status(500).json({
      error: "Facebook login failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/refresh endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Overí refresh token
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Vygeneruje nový access token
    const accessToken = generateAccessToken(userId);

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// POST /api/auth/logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Zneplatní refresh token
    const success = await revokeRefreshToken(refreshToken);

    if (!success) {
      return res.status(404).json({ error: "Refresh token not found" });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// POST /api/auth/logout-all endpoint - odhlási zo všetkých zariadení
router.post("/logout-all", authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Zneplatní všetky refresh tokeny používateľa
    await revokeAllUserTokens(req.userId);

    res.json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ error: "Logout from all devices failed" });
  }
});

// GET /api/auth/me endpoint
router.get("/me", authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
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
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
