import { db } from "@/configs";
import { DeckSnapshot, Study, StudySession, StudySessionState } from "@/protocols";
import { PatchStudyData } from "@/schemas";

// CREATE ========================================================================

function create(userId: number, deckSnapshotId: number): Promise<Study> {
  const newStudy = db.rquery(`
    INSERT INTO "study" (user_id, deck_snapshot_id)
    VALUES ($1, $2) RETURNING *;
  `, [userId, deckSnapshotId]);

  return newStudy;
}

function createSession(state: string, content: string, studyId: number): Promise<StudySession> {
  const newStudySession = db.rquery(`
    INSERT INTO "study_session" (state, content, study_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `, [state, content, studyId]);

  return newStudySession;
}

// FIND =========================================================================

function findById(studyId: number): Promise<Study> {
  const study = db.rquery(`
    SELECT * FROM "study" WHERE id=$1;
  `, [studyId]);

  return study;
}

function findByIdAndUserId(studyId: number, userId: number): Promise<Study> {
  const study = db.rquery(`
    SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
  `, [studyId, userId]);

  return study;
}

function findManyByDeckSnapshotId(deckSnapshotId: number): Promise<{ id: number }> {
  const studies = db.rquery(`
    SELECT id FROM "study" WHERE deck_snapshot_id=$1;
  `, [deckSnapshotId]);

  return studies;
}

function findManyBySnapshotIdNotId(deckSnapshotId: number, studyId:number): Promise<{ id: number }[]> {
  const studies = db.rquerya(`
    SELECT id FROM "study" WHERE deck_snapshot_id=$1 AND id NOT IN ($2);
  `, [deckSnapshotId, studyId]);

  return studies;
}

function findByDeckSnapshotId(deckSnapshotId: number): Promise<Study> {
  const study = db.rquery(`
    SELECT * FROM "study" WHERE deck_snapshot_id=$1;
  `, [deckSnapshotId]);

  return study;
}

function findByDeckSnapshotIdAndUserId(deckSnapshotId: number, userId: number): Promise<Study> {
  const study = db.rquery(`
    SELECT * FROM "study" WHERE deck_snapshot_id=$1 AND user_id=$2;
  `, [deckSnapshotId, userId]);

  return study;
}

function findManyFormatedStudies(userId: number): Promise<FormatedStudy[]> {
  const study = db.rquerya(`
    SELECT st.id, ds.name, ss.state, ds.updated_at AS "deckDate",
    st.cards_limit, st.reviews_limit, ss.id AS "studySessionId"
    FROM "study" AS st
    JOIN "deck_snapshot" AS ds ON st.deck_snapshot_id = ds.id
    LEFT JOIN "study_session" AS ss ON ss.study_id = st.id
    WHERE st.user_id = $1
    ORDER BY st.created_at DESC
  `, [userId]);

  return study;
}

export type FormatedStudy = { 
  id: number,
  name: string,
  state: string,
  deckDate: Date,
  cards_limit?: number,
  reviews_limit?: number,
  studySessionId?: number
}

function findInfoById(studyId: number): Promise<StudyInfo> {
  const studyInfo = db.rquery(`
    SELECT st.*, ss.state, ds.name
    FROM study AS st
    JOIN study_session AS ss ON ss.study_id = st.id
    JOIN deck_snapshot AS ds ON st.deck_snapshot_id = ds.id
    WHERE st.id=$1;
  `, [studyId]);

  return studyInfo;
}

export type StudyInfo = Study & Pick<StudySession, "state">;

function findSessionByStudyId(studyId: number): Promise<StudySession> {
  const studySession = db.rquery(`
    SELECT * FROM "study_session" WHERE study_id=$1;
  `, [studyId]);

  return studySession;
}

// UPDATE =======================================================================

function updateSessionState(state: string, studySessionId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "study_session" SET state=$1, updated_at=NOW() WHERE id=$2;
  `, [state, studySessionId]);

  return result;
}

function updateSessionContent(content: string, studySessionId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "study_session" SET content=$1, updated_at=NOW() WHERE id=$2;
  `, [content, studySessionId]);

  return result;
}

function update(data: PatchStudyData, studyId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "study"
    SET hard_interval=$1, good_interval=$2, easy_interval=$3,
    cards_limit=$4, cards_random=$5, reviews_limit=$6, reviews_random=$7,
    updated_at=NOW() WHERE id=$8;
  `, [data.hard_interval, data.good_interval, data.easy_interval, data.cards_limit,
    data.cards_random, data.reviews_limit, data.reviews_random, studyId]
  );

  return result;
}

function updateSessionByStudyId(state: string, content: string, studyId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "study_session" SET state=$1, content=$2, updated_at=NOW() WHERE study_id=$3;
  `, [state, content, studyId]);

  return result;
}

// DELETE =======================================================================

function deleteById(studyId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "study" WHERE id=$1;
  `, [studyId]);

  return result;
}

function deleteSessionByStudyId(studyId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "study_session" WHERE study_id=$1;
  `, [studyId]);

  return result;
}

// ==============================================================================

export const studiesRepository = {
  create,
  createSession,
  findById,
  findByIdAndUserId,
  findManyByDeckSnapshotId,
  findManyBySnapshotIdNotId,
  findByDeckSnapshotId,
  findByDeckSnapshotIdAndUserId,
  findManyFormatedStudies,
  findInfoById,
  findSessionByStudyId,
  update,
  updateSessionState,
  updateSessionContent,
  updateSessionByStudyId,
  deleteById,
  deleteSessionByStudyId
}
