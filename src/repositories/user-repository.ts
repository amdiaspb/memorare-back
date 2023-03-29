import { db } from "@/configs";
import { User } from "@/protocols";

// FIND =========================================================================

function findUnique(login: string): Promise<User> {
  const field = login.includes("@") ? "email" : "name";
  const user = db.rquery(`
    SELECT * FROM "user" WHERE ${field}=$1
  `, [login]);

  return user;
}

// CREATE ========================================================================

function create(name: string, email: string, password: string): Promise<UserCreated> {
  const query = db.rquery(`
    INSERT INTO "user" (name, email, password) VALUES ($1, $2, $3)
    RETURNING id, name, email
  `, [name, email, password]);

  return query;
}

export type UserCreated = Pick<User, "id" | "name" | "email">;

// ==============================================================================

export const userRepository = {
  findUnique,
  create
}
