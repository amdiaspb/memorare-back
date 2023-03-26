import express, { json } from "express";
import cors from "cors";
import { handleApplicationErrors } from "@/middlewares";

// DELETE IT
import { db } from "@/configs"; 

const app = express();
app
  .use(cors())
  .use(json())
  .get("/health", (_req, res) => res.send("OK!"))
  
  .get("/test", async (_req, res) => { // DELETE IT
    const query = await db.rquery(`SELECT COUNT(*) FROM "Booking"`);
    res.send(query);
  })
  .use(handleApplicationErrors);

export { app };
