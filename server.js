zrob mi databse do zgromadzania tyhc danych w pgdatabase const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const app = express();
const PORT = 3000;
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));
// Render Postgres wymaga SSL, ale zwykle z certyfikatem self-signed,
// stąd rejectUnauthorized: false
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
async function createTableIfNotExists() {
    await pool.query( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATE TABLE IF NOT EXISTS submissions ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;id SERIAL PRIMARY KEY, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e1 TEXT NOT NULL, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e2 TEXT NOT NULL, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e3 TEXT NOT NULL, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;); &nbsp;&nbsp;&nbsp;&nbsp;);
}
async function start() {
    try {
        await pool.query("SELECT 1"); // test połączenia
        console.log("Połączono z Postgres!");
        await createTableIfNotExists();
        console.log("Tabela 'submissions' gotowa.");
        app.post("/api/submit", async (req, res) => {
            try {
                const { targetUsername, yourUsername, powershell } = req.body;
                if (!targetUsername || !yourUsername || !powershell) {
                    return res.status(400).json({
                        error: "Wszystkie pola są wymagane."
                    });
                }
                const result = await pool.query(
                    INSERT INTO submissions (e1, e2, e3) VALUES ($1, $2, $3) RETURNING id,
                    [targetUsername, yourUsername, powershell]
                );
                res.json({
                    success: true,
                    id: result.rows[0].id
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Nie udało się zapisać danych."
                });
            }
        });
        app.listen(PORT, () => {
            console.log(Strona działa: http://localhost:${PORT});
        });
    } catch (error) {
        console.error("Błąd połączenia z Postgres:", error);
    }
}
start();
