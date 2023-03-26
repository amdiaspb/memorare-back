import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { User } from '@/protocols';
import { db } from '@/configs';

export async function createUser(): Promise<User> {
  const incomingPassword = faker.internet.password(6);
  const hashedPassword = await bcrypt.hash(incomingPassword, 10);
  const name = faker.name.firstName();
  const email = faker.internet.email();

  const user = await db.rquery(`
    INSERT INTO user (name, password, email)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, hashedPassword, email]);

  return user as User;
}
