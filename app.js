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

// TÜRKÇE KARAKTER DÜZELTME FONKSİYONU
// API'ye gönderilen ilçe isimlerindeki sorunları çözer
const trToEn = (str) => {
    return str.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
};

async function getEczaneler(city, dist = "") {
    const cacheKey = dist ? `eczaneler_${city}_${dist}` : `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] ${city} ${dist} verisi hafızadan getirildi.`);
        return cachedData;
    }

    try {
        console.log(`[API] ${city} ${dist} için yeni istek atılıyor...`);
        
        // Şehir ve ilçe isimlerini API'nin kabul ettiği dile çeviriyoruz
        const safeCity = trToEn(city);
        const safeDist = dist ? trToEn(dist) : "";

        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${safeCity}`;
        if (safeDist) url += `&dist=${safeDist}`;

        const response = await axios.get(url, {
            headers: { 
                'authorization': API_KEY,
                'content-type': 'application/json'
            },
            timeout: 10000 
        });

        if (response.data && response.data.success) {
            const data = response.data.result || [];
            if (data.length > 0) {
                myCache.set(cacheKey, data);
            }
            return data;
        } else {
            console.error("API Başarısız:", response.data.message || "Bilinmeyen hata");
            return [];
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.error("HATA: API Anahtarın geçersiz (401).");
        } else {
            console.error("API Bağlantı Hatası:", error.message);
        }
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    // URL'den gelen parametreleri temizle
    const il = req.params.il.toLowerCase().trim();
    const ilce = req.params.ilce ? req.params.ilce.toLowerCase().trim() : "";
    
    const eczaneler = await getEczaneler(il, ilce);
    
    const formatliEczaneler = eczaneler.map(e => ({
        ad: e.name.toUpperCase(),
        adres: e.address,
        tel: e.phone.replace(/\D/g, ''),
        ilce: e.dist.toUpperCase()
    }));

    const baslik = ilce ? `${il.toUpperCase()} / ${ilce.toUpperCase()}` : il.toUpperCase();
    
    res.render('liste', { 
        il: baslik, 
        eczaneler: formatliEczaneler 
    });
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360 | Nöbetçi Eczaneler' });
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`Eczane360 | Gerçek Veri Sistemi Aktif!`);
    console.log(`-------------------------------------------`);
});
