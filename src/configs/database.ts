import { Pool, QueryResult } from "pg";

let pool: Pool;

async function dbConnect(): Promise<void> {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.NODE_ENV === "production"),
  });

  try {
    await pool.query("SELECT NOW()");
    console.log("Database connected successfully!");
  } catch (error) {
    console.log("Database Error:", error.message);
  }
}

function dbDisconnect(): void {
  pool.end(() => {
    console.log('Pool has ended, database disconnected!')
  })
}

const db = { 
  query: simpleQuery,
  rquery: resultQuery
};

function simpleQuery(text: string, values?: any[]) {
  return pool.query(text, values);
}

async function resultQuery(text: string, values?: any[]) {
  const query = await pool.query(text, values);
  if (query.rowCount === 0) return null;
  if (query.rowCount === 1) return query.rows[0]
  return query.rows;
}

export {
  db,
  dbConnect,
  dbDisconnect
};
