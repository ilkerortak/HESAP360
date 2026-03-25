const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// ANA SAYFA
app.get('/', (req, res) => {
    res.render('index');
});

// ECZANE LİSTELEME (API Entegrasyonu Örneği)
app.get('/eczaneler/:il/:ilce', async (req, res) => {
    const { il, ilce } = req.params;
    try {
        // Not: Gerçek veride buraya bir API anahtarı veya belediye servis linki gelir.
        // Şimdilik sistemin çalışmasını görmen için örnek veri yapısı kuruyoruz.
        const eczaneler = [
            { ad: 'Hayat Eczanesi', adres: 'Atatürk Cad. No:45', tel: '0212 123 45 67', konum: '#' },
            { ad: 'Merkez Eczanesi', adres: 'Cumhuriyet Meydanı No:12', tel: '0212 987 65 43', konum: '#' }
        ];
        res.render('liste', { il, ilce, eczaneler });
    } catch (error) {
        res.status(500).send("Veri çekilemedi.");
    }
});

app.listen(3000, () => console.log('Nöbetçi Eczane Sistemi Hazır!'));
