const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

const myCache = new NodeCache({ stdTTL: 1800 }); // 30 dk cache

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// Karakter düzeltme (API'nin sevdiği format)
const trToEn = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(city) {
    const cacheKey = `nobetci_${trToEn(city)}`;
    const cachedData = myCache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
        // Sakarya verisi için en sağlam kaynaklardan biri
        const url = `https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler`; // Örnek yedek kanal veya direkt eczane API'si
        // NOT: Eğer kendi özel API anahtarın varsa buraya ekleyebiliriz.
        // Şimdilik CollectAPI'deki 400 hatasını aşmak için filtrelemeyi şehre odaklıyoruz.
        
        const response = await axios.get(`https://api.collectapi.com/health/dutyPharmacy?city=${trToEn(city)}`, {
            headers: { 'authorization': 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu' }
        });

        if (response.data.success) {
            myCache.set(cacheKey, response.data.result);
            return response.data.result;
        }
        return [];
    } catch (error) {
        console.error("Veri çekme hatası:", error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const il = req.params.il;
        const ilce = req.params.ilce || "";
        
        let veriler = await getEczaneler(il);
        
        // FİLTRELEME: API'den gelen tüm şehir verisini biz içeride süzüyoruz
        if (ilce) {
            veriler = veriler.filter(e => trToEn(e.dist) === trToEn(ilce) || (ilce === "adapazari" && trToEn(e.dist) === "merkez"));
        }

        const formatli = veriler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone.replace(/\D/g, ''),
            ilce: e.dist.toUpperCase()
        }));

        res.render('liste', { il: ilce ? `${il.toUpperCase()} / ${ilce.toUpperCase()}` : il.toUpperCase(), eczaneler: formatli });
    } catch (err) {
        res.render('liste', { il: "HATA", eczaneler: [] });
    }
});

app.get('/', (req, res) => { res.render('index'); });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Eczane360 ${PORT} portunda yayında!`));
