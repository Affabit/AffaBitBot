require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Mengambil kunci API rahasia dari environment variables Vercel
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Vercel Serverless Route (Menangkap semua request yang masuk)
app.post('/api/webhook', async (req, res) => {
    // 1. Kirim respons 200 OK ke Telegram secepatnya agar Telegram tidak mengulang pengiriman pesan
    res.sendStatus(200);

    const message = req.body.message;
    
    // 2. Filter: Pastikan objek pesan ada dan berupa teks
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const userText = message.text;

    try {
        // 3. Konfigurasi Otak AI Gemini
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Kamu adalah Admin AI resmi untuk komunitas digital AFFADIGI. Tugasmu adalah membantu anggota grup dengan menjawab pertanyaan seputar teknik prompt AI, pembuatan konten visual, dan editing video menggunakan CapCut. Jawab dengan gaya bahasa yang ramah, praktis, terstruktur (gunakan poin-poin jika perlu), dan mudah dipahami."
        });
        
        // 4. Proses teks dari grup ke Gemini
        const result = await model.generateContent(userText);
        const geminiResponse = result.response.text();

        // 5. Kirim hasil jawaban Gemini kembali ke Telegram
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: geminiResponse,
            parse_mode: "Markdown" // Memastikan teks tebal/miring/kode dari AI terbaca rapi di Telegram
        });

    } catch (error) {
        console.error("Error pada proses AI atau pengiriman Telegram:", error);
    }
});

// 6. Ekspor aplikasi untuk Vercel (Wajib tanpa app.listen)
module.exports = app;