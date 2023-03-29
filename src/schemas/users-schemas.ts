import joi from "joi";
import { User } from "@/protocols";

export const createUserSchema = joi.object<CreateUserParams>({
  name: joi.string().alphanum().min(3).max(20).required(),
  email: joi.string().email().min(3).max(30).required(),
  password: joi.string().min(6).max(30).required(),
});

export type CreateUserParams = Pick<User, "name" | "email" | "password">;
