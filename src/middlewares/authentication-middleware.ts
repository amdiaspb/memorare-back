import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import { unauthorizedError } from "@/errors";
import { db } from "@/configs";


export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  if (!authHeader) return generateUnauthorizedResponse(res);

  const token = authHeader.split(" ")[1];
  if (!token) return generateUnauthorizedResponse(res);

  try {
    const session = await db.rquery(`
      SELECT id FROM session WHERE token=$1
    `, [token]);
    if (!session) return generateUnauthorizedResponse(res);
    
    const { userId } = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.userId = userId;
    next();
  } catch (err) {
    generateUnauthorizedResponse(res);
  }
}

function generateUnauthorizedResponse(res: Response) {
  res.status(httpStatus.UNAUTHORIZED).send(unauthorizedError());
}

export type AuthenticatedRequest = Request & JWTPayload;

type JWTPayload = {
  userId: number;
};
