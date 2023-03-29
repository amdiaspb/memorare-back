import express, { json } from "express";
import cors from "cors";
import { handleApplicationErrors } from "@/middlewares";
import { db } from "@/configs"; // DELETE IT
import { usersRouter, authRouter } from "@/routers";

const app = express();
app
  .use(cors())
  .use(json())
  .get("/health", (_req, res) => res.send("OK!"))
  .use("/users", usersRouter)
  .use("/login", authRouter)
  
  .get("/test", async (_req, res) => { // DELETE IT
    const query = await db.rquery(`SELECT * FROM "user"`);
    res.send(query);
  })
  .use(handleApplicationErrors);

export { app };
