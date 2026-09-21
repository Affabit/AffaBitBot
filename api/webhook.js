require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.post('/api/webhook', async (req, res) => {
    try {
        const message = req.body.message;
        
        if (!message || !message.text) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const userText = message.text;

        // Proses AI Gemini menggunakan model standar yang paling stabil
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Kamu adalah Admin AI resmi untuk komunitas digital AFFADIGI. Tugasmu adalah membantu anggota grup dengan menjawab pertanyaan seputar teknik prompt AI, pembuatan konten visual, dan editing video menggunakan CapCut. Jawab dengan gaya bahasa yang ramah, praktis, terstruktur (gunakan poin-poin jika perlu), dan mudah dipahami."
        });
        
        const result = await model.generateContent(userText);
        const geminiResponse = result.response.text();

        // Jika berhasil, kirim jawaban AI
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: geminiResponse,
            parse_mode: "Markdown"
        });

        res.sendStatus(200);

    } catch (error) {
        console.error("Error AI:", error.message);
        
        const chatId = req.body.message?.chat?.id;
        if (chatId) {
            // SISTEM ANTI-BISU: Kirim pesan ini jika Google Gemini error 503 / sibuk
            await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: chatId,
                text: "🙏 *Mohon maaf, server AI Google sedang kelebihan beban (Overload/503).* \n\nSistem saya tetap menyala, tapi otak AI-nya sedang antre. Silakan coba tanyakan lagi dalam beberapa menit ya!"
            }).catch(e => console.error("Gagal kirim pesan darurat:", e));
        }

        // Tetap tutup request agar Vercel tidak error
        res.sendStatus(200);
    }
});

module.exports = app;