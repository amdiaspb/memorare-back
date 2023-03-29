import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { User } from '@/protocols';
import { db } from '@/configs';

export async function createUser(user: Partial<User> = {}): Promise<User> {
  const incomingPassword = user?.password || faker.internet.password(6);
  const hashedPassword = await bcrypt.hash(incomingPassword, 12);
  const name = user?.name || faker.name.firstName();
  const email = user?.email || faker.internet.email();

  user = await db.rquery(`
    INSERT INTO "user" (name, password, email)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, hashedPassword, email]);

  return user as User;
}
