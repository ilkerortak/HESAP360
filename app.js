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

// Türkçe Karakter Temizleme
const trToEn = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(city, dist = "") {
    const cacheKey = dist ? `eczaneler_${city}_${dist}` : `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) return cachedData;

    try {
        const safeCity = trToEn(city);
        const safeDist = trToEn(dist);

        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${safeCity}`;
        if (safeDist) url += `&dist=${safeDist}`;

        const response = await axios.get(url, {
            headers: { 'authorization': API_KEY }
        });

        if (response.data && response.data.success) {
            const data = response.data.result || [];
            myCache.set(cacheKey, data);
            return data;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const il = req.params.il || "sakarya";
        const ilce = req.params.ilce || "";
        
        const eczaneler = await getEczaneler(il, ilce);
        
        const formatliEczaneler = eczaneler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone.replace(/\D/g, ''),
            ilce: e.dist.toUpperCase()
        }));

        const baslik = ilce ? `${il.toUpperCase()} / ${ilce.toUpperCase()}` : il.toUpperCase();
        
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sistem ${PORT} portunda aktif!`));
