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
        
        // Filter: Hentikan jika bukan pesan teks (misal: stiker/gambar)
        if (!message || !message.text) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const userText = message.text;

        // Proses AI Gemini
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Kamu adalah Admin AI resmi untuk komunitas digital AFFADIGI. Tugasmu adalah membantu anggota grup dengan menjawab pertanyaan seputar teknik prompt AI, pembuatan konten visual, dan editing video menggunakan CapCut. Jawab dengan gaya bahasa yang ramah, praktis, terstruktur (gunakan poin-poin jika perlu), dan mudah dipahami."
        });
        
        const result = await model.generateContent(userText);
        const geminiResponse = result.response.text();

        // Kirim balasan ke Telegram
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: geminiResponse,
            parse_mode: "Markdown"
        });

        // VERCEL RULE: Laporan penutup wajib di akhir agar proses AI tidak terpotong
        res.sendStatus(200);

    } catch (error) {
        console.error("Error pada proses AI:", error);
        // Tetap kirim 200 jika error agar Telegram tidak terus-menerus mencoba mengirim pesan yang sama
        res.sendStatus(200);
    }
});

module.exports = app;