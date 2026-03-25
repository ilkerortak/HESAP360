const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

const myCache = new NodeCache({ stdTTL: 3600 }); 
const API_KEY = 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu'; 

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// API'ye gönderirken Türkçe karakterleri temizler (Ankara, Sakarya vb.)
const trToEn = (str) => {
    if (!str) return "";
    return str.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
              .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
              .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
              .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
};

async function getEczaneler(sehir, ilceAd = "") {
    const cacheKey = ilceAd ? `eczaneler_${sehir}_${ilceAd}` : `eczaneler_${sehir}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) return cachedData;

    try {
        // COLLECTAPI'NIN İSTEDİĞİ FORMAT: il ve ilce
        let url = `https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(sehir)}`;
        if (ilceAd) url += `&ilce=${encodeURIComponent(ilceAd)}`;

        console.log(`[İstek] URL: ${url}`);

        const response = await axios.get(url, {
            headers: { 
                'authorization': API_KEY,
                'content-type': 'application/json'
            }
        });

        if (response.data && response.data.success) {
            const result = response.data.result || [];
            myCache.set(cacheKey, result);
            return result;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.response ? error.response.status : error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const ilRaw = req.params.il;
        const ilceRaw = req.params.ilce || "";
        
        // API'ye gönderilecek temiz isimler
        const il = trToEn(ilRaw);
        const ilce = ilceRaw ? trToEn(ilceRaw) : "";
        
        const veriler = await getEczaneler(il, ilce);
        
        const formatliEczaneler = veriler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone.replace(/\D/g, ''),
            ilce: e.dist.toUpperCase()
        }));

        const baslik = ilceRaw ? `${ilRaw.toUpperCase()} / ${ilceRaw.toUpperCase()}` : ilRaw.toUpperCase();
        
        res.render('liste', { il: baslik, eczaneler: formatliEczaneler });
    } catch (err) {
        res.render('liste', { il: "HATA", eczaneler: [] });
    }
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360' });
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Eczane360 ${PORT} portunda aktif!`));
