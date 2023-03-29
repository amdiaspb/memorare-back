import { db } from "@/configs";
import { Session } from "@/protocols";

// CREATE ========================================================================

function create(userId: number, token: string): Promise<Session> {
  const query = db.rquery(`
    INSERT INTO "session" (user_id, token) VALUES ($1, $2);
  `, [userId, token]);

  return query;
}

// ==============================================================================

export const sessionRepository = {
  create
}
