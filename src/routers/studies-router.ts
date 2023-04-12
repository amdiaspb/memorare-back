import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { deleteStudy, getFormatedStudies, getFormatedStudySession, getStudyInfo, patchStudy, patchStudySession, postStudy } from "@/controllers";
import { patchStudySchema, patchStudySessionSchema, postStudySchema } from "@/schemas/studies-schemas";

const studiesRouter = Router();

studiesRouter
  .all("/*", authenticateToken)

  .post("/", validateBody(postStudySchema), postStudy)
  .get("/", getFormatedStudies)
  .get("/:study_id", getStudyInfo)
  .patch("/:study_id", validateBody(patchStudySchema), patchStudy)
  .delete("/:study_id", deleteStudy)
  
  .get("/:study_id/session", getFormatedStudySession)
  .patch("/:study_id/session", validateBody(patchStudySessionSchema), patchStudySession)
;

export { studiesRouter };
