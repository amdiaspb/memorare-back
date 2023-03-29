import * as jwt from "jsonwebtoken";
import { createUser } from "@/factories";
import { db } from '@/configs';
import { Session } from "@/protocols";

export async function createSession(userId?: number): Promise<Session> {
  if (!userId) userId = (await createUser()).id;
  const token = generateToken(userId);

  const session = await db.rquery(`
    INSERT INTO "session" (user_id, token)
    VALUES ($1, $2)
    RETURNING *
  `, [userId, token]);

  return session as Session;
}

async function generateToken(userId: number) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return token;
}

