require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Inisialisasi API Telegram & Gemini dari Environment Variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Endpoint Webhook
app.post('/webhook', async (req, res) => {
    // Beri respons 200 OK ke Telegram agar tidak dikirim ulang
    res.sendStatus(200);

    const message = req.body.message;
    
    // Pastikan ada pesan teks yang masuk
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const userText = message.text;

    try {
        // 1. Panggil Gemini API
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Kamu adalah Admin AI di grup kelas belajar. Jawab dengan praktis, ringkas, dan ramah."
        });
        const result = await model.generateContent(userText);
        const geminiResponse = result.response.text();

        // 2. Kirim balasan kembali ke grup Telegram
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: geminiResponse,
            parse_mode: "Markdown" // Agar format tebal/miring dari Gemini terbaca
        });

    } catch (error) {
        console.error("Error memproses AI atau mengirim pesan:", error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server bot berjalan di port ${PORT}`);
});