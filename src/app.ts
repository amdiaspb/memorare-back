import express, { json } from "express";
import cors from "cors";
import { handleApplicationErrors } from "@/middlewares";
import { db } from "@/configs"; // DELETE IT
import { usersRouter, authRouter, workshopRouter } from "@/routers";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { Card, Study } from "./protocols";

const app = express();
app
  .use(cors())
  .use(json())
  .get("/health", (_req, res) => res.send("OK!"))
  .use("/users", usersRouter)
  .use("/login", authRouter)
  .use("/workshop", workshopRouter)

  // DECKS ============================================

  .post("/decks", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const snapshot = await db.rquery(`
      INSERT INTO "deck_snapshot" (name, content) VALUES ('', '') RETURNING id;
    `);
    
    const deck = await db.rquery(`
      INSERT INTO "deck" (name, readme, visibility, user_id, deck_snapshot_id)
      VALUES ($1, '', 'private', $2, $3)
      RETURNING *;
    `, [faker.random.numeric(12), session.user_id, snapshot.id]);

    res.send(deck);
  })

  .get("/decks/user", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const query = await db.query(`
      SELECT d.* 
      FROM "deck" AS d
      JOIN "session" AS s
      ON d.user_id = s.user_id
      WHERE s.token = $1
    `, [token]);

    res.send(query.rows);
  })

  .get("/decks", async(req, res) => {
    const query = await db.query(`
      SELECT * FROM "deck";
    `);

    res.send(query.rows);
  })

  // STUDY ===========================================

  .post("/study", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const { snapshotId } = req.body;

    let study = await db.rquery(`
      SELECT * FROM "study" WHERE deck_snapshot_id=$1;
    `, [snapshotId]);

    if (study) return res.send("OK!");
    
    study = await db.rquery(`
      INSERT INTO "study" (user_id, deck_snapshot_id)
      VALUES ($1, $2)
      RETURNING *;
    `, [session.user_id, snapshotId]);

    res.send(study);
  })

  // formated for listing
  .get("/studies", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const query = await db.query(`
      SELECT stu.id, snap.name AS name, stu.cards_limit, stu.reviews_limit, stu_ses.id AS "studySessionId", stu_ses.state
      FROM "study" AS stu
      JOIN "session" AS ses ON stu.user_id = ses.user_id
      JOIN "deck_snapshot" AS snap ON stu.deck_snapshot_id = snap.id
      LEFT JOIN "study_session" AS stu_ses ON stu_ses.study_id = stu.id
      WHERE ses.token = $1
    `, [token]);

    const today = dayjs().format("DD/MM/YYYY"); // FIX
    for (let i = 0; i < query.rows.length; i++) {
      const study = query.rows[i];
      study.state = JSON.parse(study.state);
      const state = study.state;

      const { studySessionId, cards_limit, reviews_limit } = study;
      delete study.studySessionId;
      delete study.cards_limit;
      delete study.reviews_limit;

      if (!study.state) break;
      if (state.date >= today) break;

      state.date = today;
      state.today[0] = Math.min(cards_limit, state.total[0]);
      state.today[1] = state.total[1];
      state.today[2] = Math.min(reviews_limit, state.total[2]);
      await db.rquery(`
        UPDATE "study_session" SET state=$1 WHERE id=$2;
      `, [JSON.stringify(state), studySessionId]);
    };

    res.send(query.rows);
  })

  .post("/studies/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const { studyId } = req.body;

    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;

    if (!study) return res.send("DEU RUIM! Study");

    let studySession = await db.rquery(`
      SELECT id, state, content, study_id FROM "study_session" WHERE study_id=$1;
    `, [study.id]);
    const { hard_interval, good_interval, easy_interval, cards_limit, reviews_limit } = study;
    const intervals = [hard_interval, good_interval, easy_interval];
    const options = { cards_limit, reviews_limit };
    if (studySession) return res.send({ ...studySession, intervals, options });

    // TODO: GET FROM SNAPSHOT (code bellow is getting all the cards from user not only from deck)
    const query = await db.query(`
      SELECT c.id
      FROM "card" AS c
      JOIN "deck" AS d
      ON c.deck_id = d.id
      WHERE d.user_id=$1;
    `, [session.user_id]);

    const cards = query.rows;
    const state = {
      date: dayjs().format("DD/MM/YYYY"),
      total: [cards.length, 0, 0],
      today: [Math.min(study.cards_limit, cards.length), 0, 0]
    }
    
    const content = {
      cards: cards.map((c, i) => i),
      study: new Array(),
      review: new Array()
    }

    studySession = await db.rquery(`
      INSERT INTO "study_session" (state, content, study_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [state, content, study.id]);

    res.send(studySession);
  })

  .patch("/studies/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];
    
    const session = await db.rquery(`
    SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    
    // SCHEMA CHECK
    
    const { studyId } = req.body;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;
    
    if (!study) return res.send("DEU RUIM! PATCH STUDY SESSION");

    const { data } = req.body;
    await db.rquery(`
      UPDATE "study_session" SET state=$1, content=$2 WHERE study_id=$3;
    `, [data.state, data.content, study.id]);

    res.sendStatus(200);
  })

  // ===============================================

  .get("/cards/deck/:deckId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];
    const { deckId } = req.params;

    const query = await db.query(`
      SELECT id, name, front, back FROM "card" WHERE deck_id=$1
    `, [+deckId]);

    res.send(query.rows);
  })
  
  .get("/test", async (_req, res) => { // DELETE IT
    //SELECT * FROM "session"
    //INSERT INTO "deck" (name, readme, visibility, user_id) VALUES ('One', 'Wazap', 'private', 8) RETURNING *
    const query = await db.rquery(`
      SELECT * FROM "workshop_session"
    `);
    res.send(query);
  })
  .use(handleApplicationErrors);

export { app };
