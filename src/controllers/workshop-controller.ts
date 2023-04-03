/* // import userService from "@/services/users-service";
import { AuthenticatedRequest } from "@/middlewares";
import { UpsertWorkshopSessionParams } from "@/schemas";
import { authService, workshopService } from "@/services";
import { Response } from "express";
import httpStatus from "http-status";

// GET ========================================================================

export async function getWorkshopSession(req: AuthenticatedRequest, res: Response) {
  const { deckId } = req.params;
  const { userId } = req;

  try {
    const session = await workshopService.findWorkshopSession(userId, +deckId);
    return res.send(JSON.parse(session.state));
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error);
    }
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// POST =======================================================================

export async function upsertWorkshopSession(req: AuthenticatedRequest, res: Response) {
  const { deckId, stateObj } = req.body as UpsertWorkshopSessionParams;
  const { userId } = req;

  try {
    const sessionId = await workshopService.upsertWorkshopSession(userId, deckId, stateObj);
    return res.status(httpStatus.CREATED).send(sessionId);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}
 */