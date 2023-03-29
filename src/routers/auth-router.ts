import { Router } from "express";
import { validateBody } from "@/middlewares";
import { signinSchema } from "@/schemas";
import { postSignin } from "@/controllers";

const authRouter = Router();

authRouter.post("/", validateBody(signinSchema), postSignin);

export { authRouter };
