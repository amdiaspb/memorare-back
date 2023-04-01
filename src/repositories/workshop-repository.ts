import { db } from "@/configs";
import { User, WorkshopSession } from "@/protocols";
import { WorkshopSessionState } from "@/services";

// FIND =========================================================================

function findUnique(deckId: number): Promise<WorkshopSession> { // deck_id should be unique, change table
  const session = db.rquery(`
    SELECT * FROM workshop_session WHERE deck_id=$1
  `, [deckId]);

  return session;
}

// CREATE ========================================================================

function create(userId: number, deckId: number, stateObj: WorkshopSessionState): Promise<WorkshopSessionId> {
  const query = db.rquery(`
    INSERT INTO "workshop_session" (user_id, deck_id, state) VALUES ($1, $2, $3)
    RETURNING id
  `, [userId, deckId, stateObj]);

  return query;
}

// UPDATE =======================================================================

function update(stateObj: WorkshopSessionState, deckId: number): Promise<WorkshopSessionId> {
  const query = db.rquery(`
    UPDATE "workshop_session" SET state=$1 WHERE deck_id=$2
    RETURNING id
  `, [stateObj, deckId]);

  return query;
}

// ==============================================================================

export type WorkshopSessionId = number;

export const workshopRepository = {
  findUnique,
  create,
  update
}
