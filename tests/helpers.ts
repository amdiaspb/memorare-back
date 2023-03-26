import { db } from "./configs";

export async function cleanDb() {
  await db.query(`TRUNCATE user CASCADE`);
}
