import { Router } from "express";
import { createUserSchema } from "@/schemas";
import { validateBody } from "@/middlewares";
import { postSignup } from "@/controllers";

const usersRouter = Router();

usersRouter.post("/", validateBody(createUserSchema), postSignup);

export { usersRouter };
