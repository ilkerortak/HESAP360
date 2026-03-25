const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();
// Senin NosyAPI Token'ın
const NOSY_TOKEN = 'CSsas9Y81PH7hgA3I1n6n3AHgKSQW32fmndxsNWSqzaHARVAorMP5rJyJ5oK'; 
const BASE_URL = 'https://www.nosyapi.com/apiv2/service/pharmacies-on-duty';

const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

// Karakter eşleşme sorunlarını bitiren temizlik fonksiyonu
const normalizeText = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(sehir, ilceAd = "") {
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${normalizeText(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    // 1. ÖNCE YEREL DEPO (CACHE) KONTROLÜ
    if (fs.existsSync(dosyaYolu)) {
        console.log(`[YEREL DEPO] ${sehir} okunuyor...`);
        const cachedData = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
        if (ilceAd) {
            const filtered = cachedData.filter(e => normalizeText(e.dist || e.district) === normalizeText(ilceAd));
            return filtered.length > 0 ? filtered : cachedData;
        }
        return cachedData;
    }

    // 2. YERELDE YOKSA NOSYAPI'YE GİT
    try {
        console.log(`[NOSY-API CALL] ${sehir} verisi çekiliyor...`);
        
        // NosyAPI parametreleri: city ve opsiyonel olarak county
        let url = `${BASE_URL}?city=${encodeURIComponent(sehir.toLowerCase())}`;
        if (ilceAd) {
            url += `&county=${encodeURIComponent(ilceAd.toLowerCase())}`;
        }

        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        // NosyAPI verisi genelde response.data.data içinde dizi olarak gelir
        const result = response.data.data || [];
        
        if (result.length > 0) {
            // Veriyi gün boyu kullanmak için kaydet
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            return result;
        }
        return [];
    } catch (error) {
        console.error("API Bağlantı Hatası:", error.message);
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const veriler = await getEczaneler(req.params.il, req.params.ilce || "");
        
        const formatli = veriler.map(e => ({
            ad: (e.name || "Bilinmiyor").toUpperCase(),
            adres: e.address || "Adres bilgisi yok",
            tel: (e.phone || "").replace(/\D/g, ''),
            ilce: (e.dist || e.district || req.params.il).toUpperCase()
        }));

        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: formatli });
    } catch (err) {
        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: [] });
    }
});

// Cache temizleme rotası (Önemli!)
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Sistem sıfırlandı. Şimdi tekrar sorgu yapabilirsin.");
});

// Sayfalar
app.get('/', (req, res) => res.render('index', { title: 'Eczane360' }));
app.get('/hakkimizda', (req, res) => res.render('hakkimizda', { title: 'Hakkımızda' }));
app.get('/kvkk', (req, res) => res.render('kvkk', { title: 'KVKK' }));
app.get('/iletisim', (req, res) => res.render('iletisim', { title: 'İletişim' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

app.listen(process.env.PORT || 8080, () => console.log("Eczane360 Yayında!"));
