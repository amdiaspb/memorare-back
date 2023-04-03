import { Router } from "express";
//import { upsertWorkshopSessionSchema } from "@/schemas";
import { authenticateToken, validateBody } from "@/middlewares";
//import { getWorkshopSession, upsertWorkshopSession } from "@/controllers";

const workshopRouter = Router();

workshopRouter
  .all("/*", authenticateToken)
/*   .get("/:deckId", getWorkshopSession)
  .post("/", validateBody(upsertWorkshopSessionSchema), upsertWorkshopSession); */

export { workshopRouter };
