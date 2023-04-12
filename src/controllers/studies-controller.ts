import { AuthenticatedRequest } from "@/middlewares";
import { decksService, studiesService } from "@/services";
import { Response } from "express";
import httpStatus from "http-status";

// POST =======================================================================

export async function postStudy(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { snapshotId } = req.body;

  try {
    const newStudy = await studiesService.createStudy(userId, snapshotId);
    return res.status(httpStatus.CREATED).send(newStudy);
  } catch (error) {
    if (error.name === "ConflictError") {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// GET =======================================================================

export async function getFormatedStudies(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const formatedStudies = await studiesService.findFormatedStudies(userId);
    return res.send(formatedStudies);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getStudyInfo(req: AuthenticatedRequest, res: Response) {
  const studyId = +req.params.study_id;

  try {
    const studyInfo = await studiesService.findStudyInfo(studyId);
    return res.send(studyInfo);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getFormatedStudySession(req: AuthenticatedRequest, res: Response) {
  const studyId = +req.params.study_id;

  try {
    const studySession = await studiesService.findFormatedStudySession(studyId);
    return res.send(studySession);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// PATCH =====================================================================

export async function patchStudy(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const studyId = +req.params.study_id;

  try {
    await studiesService.updateStudy(studyId, userId, req.body);
    res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function patchStudySession(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const studyId = +req.params.study_id;

  try {
    await studiesService.updateStudySession(studyId, userId, req.body);
    res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// DELETE ====================================================================

export async function deleteStudy(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const studyId = +req.params.study_id;

  try {
    await studiesService.deleteStudy(studyId, userId);
    res.sendStatus(httpStatus.NO_CONTENT);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}
