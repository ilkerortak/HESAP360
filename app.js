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

// API'ye sadece şehri soran fonksiyon
async function getEczaneler(city) {
    const cacheKey = `eczaneler_${trToEn(city)}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) return cachedData;

    try {
        const safeCity = trToEn(city);
        // DİKKAT: dist parametresini tamamen kaldırdık, 400 hatası artık gelmez
        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${safeCity}`;

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
        console.error("API Bağlantı Hatası:", error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const il = req.params.il || "sakarya";
        const ilce = req.params.ilce ? req.params.ilce.toLowerCase() : "";
        
        // Önce şehrin tamamını çekiyoruz (API buna her zaman 200 OK verir)
        let tumEczaneler = await getEczaneler(il);
        
        // Filtreleme mantığı: Eğer ilçe seçilmişse liste içinden biz ayıklıyoruz
        if (ilce) {
            tumEczaneler = tumEczaneler.filter(e => {
                const apiIlce = trToEn(e.dist);
                // "adapazari" seçildiyse hem "adapazari" hem de "merkez" olanları getir
                if (ilce === "adapazari") {
                    return apiIlce === "adapazari" || apiIlce === "merkez";
                }
                return apiIlce === trToEn(ilce);
            });
        }
        
        const formatliEczaneler = tumEczaneler.map(e => ({
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Sistem ${PORT} portunda aktif!`));
