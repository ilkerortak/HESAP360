const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache'); // Hafıza yönetimi için
const expressLayouts = require('express-ejs-layouts');
const app = express();

const myCache = new NodeCache({ stdTTL: 3600 }); // Veriyi 1 saat (3600 sn) sakla
const API_KEY = 'apikey 5N7M7f6Xp6Q1R1S1:7j9B8V8C8D8E8F8'; // Buraya kendi key'ini koyacaksın

app.set('view engine', 'ejs');
app.use(expressLayouts);

// GENEL VERİ ÇEKME FONKSİYONU
async function getEczaneler(city) {
    const cacheKey = `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
        console.log(`${city} verisi hafızadan getirildi.`);
        return cachedData;
    }

    try {
        const response = await axios.get(`https://api.collectapi.com/health/dutyPharmacy?city=${city}`, {
            headers: { 'authorization': API_KEY }
        });

        if (response.data.success) {
            const data = response.data.result;
            myCache.set(cacheKey, data); // 1 saatliğine hafızaya at
            return data;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.message);
        return [];
    }
}

// 81 İL İÇİN DİNAMİK ROTA
app.get('/eczaneler/:il', async (req, res) => {
    const il = req.params.il.toLowerCase();
    const eczaneler = await getEczaneler(il);
    
    // API'den gelen veriyi bizim formata çeviriyoruz
    const formatliEczaneler = eczaneler.map(e => ({
        ad: e.name.toUpperCase(),
        adres: e.address,
        tel: e.phone.replace(/\D/g, ''),
        ilce: e.dist.toUpperCase()
    }));

    res.render('liste', { il: il.toUpperCase(), eczaneler: formatliEczaneler });
});

app.get('/', (req, res) => res.render('index'));

// ADSENSE
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`81 İl Destekli Sistem Aktif!`));
