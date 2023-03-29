
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@/protocols";
import { sessionRepository, UserCreated, userRepository } from "@/repositories";
import { conflictError, unauthorizedError } from "@/errors";

// Signin =======================================================================

async function signin(login: string, password: string): Promise<SigninInfo> {
  // valid: user
  const user = await userRepository.findUnique(login);
  if (!user) throw unauthorizedError();

  // valid: correct password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw unauthorizedError();

  // create: token and session
  const { id, name } = user;
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET);
  await sessionRepository.create(id, token);

  // return: info
  const info = { user: { id, name }, token };
  return info;
}

type SigninInfo = {
  user: Pick<User, "id" | "name">;
  token: string;
};

// Signup =======================================================================

async function signup(name: string, email: string, password: string): Promise<UserCreated> {
  // valid: name and email
  let user = await userRepository.findUnique(name);
  if (user) throw conflictError("username");
  user = await userRepository.findUnique(email);
  if (user) throw conflictError("email");

  // create: user
  const hashedPassword = await bcrypt.hash(password, 12);
  return await userRepository.create(name, email, hashedPassword);
}

// ==============================================================================

export const authService = {
  signin,
  signup
}
