// import userService from "@/services/users-service";
import { authService } from "@/services";
import { Request, Response } from "express";
import httpStatus from "http-status";

// Signin =======================================================================

export async function postSignin(req: Request, res: Response) {
  const { login, password } = req.body;

  try {
    const info = await authService.signin(login, password);
    return res.send(info);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// Signup =======================================================================

export async function postSignup(req: Request, res: Response) {
  const { name, email, password } = req.body;

  try {
    const data = await authService.signup(name, email, password);
    return res.status(httpStatus.CREATED).json(data);
  } catch (error) {
    if (error.name === "ConflictError") {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}
