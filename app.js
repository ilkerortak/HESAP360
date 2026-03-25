const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

// Veriyi 1 saat saklar. Test aşamasında stdTTL: 1 yaparsan her seferinde taze veri çeker.
const myCache = new NodeCache({ stdTTL: 3600 }); 
const API_KEY = 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu'; 

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// Türkçe Karakter Temizleme (Geliştirildi)
const trToEn = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(city, dist = "") {
    // Hafıza kontrolü
    const cacheKey = dist ? `eczaneler_${city}_${dist}` : `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] ${city}/${dist} verisi hafızadan getirildi.`);
        return cachedData;
    }

    try {
        const safeCity = trToEn(city);
        const safeDist = trToEn(dist);

        console.log(`[API İsteği] Atılan URL: https://api.collectapi.com/health/dutyPharmacy?city=${safeCity}&dist=${safeDist}`);

        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${safeCity}`;
        if (safeDist) url += `&dist=${safeDist}`;

        const response = await axios.get(url, {
            headers: { 
                'authorization': API_KEY,
                'content-type': 'application/json'
            },
            timeout: 8000 // 8 saniye gecikme sınırı
        });

        if (response.data && response.data.success) {
            const data = response.data.result || [];
            
            // Sadece veri varsa cache'e al (Boş listeyi cache'leme ki hata düzelince gelsin)
            if (data.length > 0) {
                myCache.set(cacheKey, data);
                console.log(`[Başarılı] ${safeCity}/${safeDist} için ${data.length} eczane bulundu.`);
            } else {
                console.warn(`[Uyarı] API başarı dedi ama liste boş döndü: ${safeCity}/${safeDist}`);
            }
            return data;
        } else {
            console.error("API Yanıt Hatası:", response.data.message || "Başarısız success durumu");
            return [];
        }
    } catch (error) {
        console.error("API Bağlantı Hatası:", error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const il = req.params.il ? req.params.il.toLowerCase() : "sakarya";
        const ilce = req.params.ilce ? req.params.ilce.toLowerCase() : "";
        
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
    } catch (err) {
        console.error("Rota Hatası:", err.message);
        res.render('liste', { il: "SİSTEM HATASI", eczaneler: [] });
    }
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360' });
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------`);
    console.log(`Eczane360 | Port: ${PORT} | Aktif`);
    console.log(`-----------------------------------`);
});
