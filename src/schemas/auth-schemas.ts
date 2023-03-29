import joi from "joi";
import { User } from "@/protocols";

export const signinSchema = joi.object<SigninParams>({
  login: joi.string().min(3).max(30).required(),
  password: joi.string().min(6).max(30).required(),
});

export type SigninParams = Pick<User, "password"> | { login: string };
