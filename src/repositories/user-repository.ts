import { db } from "@/configs";
import { User } from "@/protocols";

// CREATE ========================================================================

function create(name: string, email: string, password: string): Promise<UserCreated> {
  const query = db.rquery(`
    INSERT INTO "user" (name, email, password) VALUES ($1, $2, $3)
    RETURNING id, name, email
  `, [name, email, password]);

  return query;
}

export type UserCreated = Pick<User, "id" | "name" | "email">;

// FIND =========================================================================

function findUnique(login: string): Promise<User> {
  const field = login.includes("@") ? "email" : "name";
  const user = db.rquery(`
    SELECT * FROM "user" WHERE ${field}=$1
  `, [login]);

  return user;
}

function findById(userId: number): Promise<User> {
  const user = db.rquery(`
    SELECT * FROM "user" WHERE id=$1
  `, [userId]);

  return user;
}

// UPDATE ========================================================================

function updateDeckCountById(deckCount: number, userId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "user" SET deck_count=$1 WHERE id=$2;
  `, [deckCount, userId]);

  return result;
}

// ==============================================================================

export const userRepository = {
  create,
  findUnique,
  findById,
  updateDeckCountById
}
