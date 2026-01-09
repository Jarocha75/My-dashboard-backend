import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../prisma/client.js";

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minút
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 dní v milisekundách

export interface TokenPayload {
  userId: number;
}

/**
 * Generuje access token s krátkou expiráciou
 */
export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generuje refresh token a uloží ho do databázy
 */
export async function generateRefreshToken(userId: number): Promise<string> {
  // Vygeneruje náhodný refresh token
  const token = crypto.randomBytes(64).toString("hex");

  // Vypočíta expiráciu (7 dní od teraz)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

  // Uloží token do databázy
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Overí refresh token a vráti userId ak je token platný
 */
export async function verifyRefreshToken(
  token: string
): Promise<number | null> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!refreshToken) {
    return null;
  }

  // Skontroluje, či nevypršal
  if (refreshToken.expiresAt < new Date()) {
    // Vymaže expirovaný token
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });
    return null;
  }

  return refreshToken.userId;
}

/**
 * Zneplatní refresh token (použije sa pri logout)
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Zneplatní všetky refresh tokeny používateľa
 */
export async function revokeAllUserTokens(userId: number): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Vyčistí expirované refresh tokeny z databázy
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
