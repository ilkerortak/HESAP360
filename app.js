const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

// Sakarya Nöbetçi Eczane Rotası (Örnek Veri ile)
app.get('/eczaneler/sakarya', async (req, res) => {
    try {
        // Buraya ileride gerçek API linkini koyacağız
        const eczaneler = [
            { ad: "SAKARYA ECZANESİ", adres: "Adapazarı, Atatürk Bulvarı No:10", tel: "02642740000", konum: "https://maps.google.com" },
            { ad: "MERKEZ ECZANESİ", adres: "Serdivan, Mavi Durak Yanı", tel: "02642110000", konum: "https://maps.google.com" }
        ];
        res.render('liste', { il: 'Sakarya', eczaneler });
    } catch (error) {
        res.render('liste', { il: 'Sakarya', eczaneler: [], hata: "Veriler şu an alınamıyor." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sistem ${PORT} portunda hazır.`));
