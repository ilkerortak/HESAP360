const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache'); // Kota koruması için
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

// Verileri 1 saat (3600 saniye) boyunca hafızada tutar. 
// Bu sayede her tıklamada API kotan azalmaz, site çok hızlı açılır.
const myCache = new NodeCache({ stdTTL: 3600 }); 

// SENİN ÖZEL API ANAHTARIN
const API_KEY = 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu'; 

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// GENEL VERİ ÇEKME FONKSİYONU (İlçe Destekli)
async function getEczaneler(city, dist = "") {
    // Hafıza anahtarını ilçe varsa ona göre benzersiz yapıyoruz
    const cacheKey = dist ? `eczaneler_${city}_${dist}` : `eczaneler_${city}`;
    const cachedData = myCache.get(cacheKey);

    // Eğer veri daha önce çekilmişse ve 1 saat geçmemişse hafızadan ver
    if (cachedData) {
        console.log(`[Cache] ${city} ${dist} verisi hafızadan getirildi.`);
        return cachedData;
    }

    try {
        console.log(`[API] ${city} ${dist} için yeni istek atılıyor...`);
        let url = `https://api.collectapi.com/health/dutyPharmacy?city=${city}`;
        if (dist) url += `&dist=${dist}`;

        const response = await axios.get(url, {
            headers: { 
                'authorization': API_KEY,
                'content-type': 'application/json'
            },
            timeout: 10000 // 10 saniye içinde cevap gelmezse iptal et
        });

        if (response.data && response.data.success) {
            const data = response.data.result;
            myCache.set(cacheKey, data); // Gelen veriyi 1 saatliğine hafızaya yaz
            return data;
        } else {
            console.error("API Başarısız:", response.data.message || "Bilinmeyen hata");
            return [];
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.error("HATA: API Anahtarın geçersiz veya yetkisi yok (401).");
        } else {
            console.error("API Bağlantı Hatası:", error.message);
        }
        return [];
    }
}

// 81 İL VE İLÇE DESTEKLİ DİNAMİK ROTA
// Örnek kullanım: /eczaneler/sakarya  VEYA  /eczaneler/sakarya/serdivan
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il.toLowerCase();
    const ilce = req.params.ilce ? req.params.ilce.toLowerCase() : "";
    
    const eczaneler = await getEczaneler(il, ilce);
    
    // API'den gelen karmaşık veriyi temizleyip sadeleştiriyoruz
    const formatliEczaneler = eczaneler.map(e => ({
        ad: e.name.toUpperCase(),
        adres: e.address,
        tel: e.phone.replace(/\D/g, ''), // Telefonu sadece rakamlara çevirir
        ilce: e.dist.toUpperCase()
    }));

    // Başlıkta ilçe varsa "SAKARYA / SERDİVAN" şeklinde gösterir
    const baslik = ilce ? `${il.toUpperCase()} / ${ilce.toUpperCase()}` : il.toUpperCase();
    
    res.render('liste', { 
        il: baslik, 
        eczaneler: formatliEczaneler 
    });
});

// ANA SAYFA
app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360 | Nöbetçi Eczaneler' });
});

// ADSENSE DOĞRULAMASI
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`Eczane360 Sistemi Yayında!`);
    console.log(`Port: ${PORT}`);
    console.log(`Mod: 81 İl ve İlçe Destekli (Caching Aktif)`);
    console.log(`-------------------------------------------`);
});
