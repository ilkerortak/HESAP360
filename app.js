const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

const myCache = new NodeCache({ stdTTL: 3600 }); // 1 saat hafızada tut
const API_KEY = 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu'; 

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

// GENEL VERİ ÇEKME FONKSİYONU (İlçe Destekli)
async function getEczaneler(city, dist = "") {
    // Hafıza anahtarını ilçe varsa ona göre oluşturuyoruz
    const cacheKey = dist ? `eczaneler_${city}_${dist}` : `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
        console.log(`${city} ${dist} verisi hafızadan getirildi.`);
        return cachedData;
    }

    try {
        // Eğer ilçe (dist) varsa API'ye ekliyoruz
        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${city}`;
        if (dist) url += `&dist=${dist}`;

        const response = await axios.get(url, {
            headers: { 'authorization': API_KEY }
        });

        if (response.data.success) {
            const data = response.data.result;
            myCache.set(cacheKey, data); 
            return data;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.message);
        return [];
    }
}

// 81 İL VE İLÇE İÇİN DİNAMİK ROTA
// Bu rota hem "/eczaneler/sakarya" hem de "/eczaneler/sakarya/serdivan"ı yakalar
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il.toLowerCase();
    const ilce = req.params.ilce ? req.params.ilce.toLowerCase() : "";
    
    const eczaneler = await getEczaneler(il, ilce);
    
    const formatliEczaneler = eczaneler.map(e => ({
        ad: e.name.toUpperCase(),
        adres: e.address,
        tel: e.phone.replace(/\D/g, ''),
        ilce: e.dist.toUpperCase()
    }));

    const baslik = ilce ? `${il.toUpperCase()} / ${ilce.toUpperCase()}` : il.toUpperCase();
    res.render('liste', { il: baslik, eczaneler: formatliEczaneler });
});

app.get('/', (req, res) => res.render('index'));

// ADSENSE
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Eczane360 | 81 İl ve İlçe Sistemi Aktif!`));
