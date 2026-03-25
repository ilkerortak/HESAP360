const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();
// BURAYA NOSYAPI'DEN ALDIĞIN TOKEN'I YAPIŞTIR
const NOSY_TOKEN = 'CSsas9Y81PH7hgA3I1n6n3AHgKSQW32fmndxsNWSqzaHARVAorMP5rJyJ5oK'; 

const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

// Karakter temizleme fonksiyonu
const trToEn = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
        .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
        .trim();
};

async function getEczaneler(sehir, ilceAd = "") {
    // Türkiye saatini baz alıyoruz (Örn: 2026-03-25)
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${trToEn(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    // 1. ÖNCE YEREL CACHE KONTROLÜ
    if (fs.existsSync(dosyaYolu)) {
        console.log(`[DEPO] ${sehir} verisi yerelden okundu.`);
        const cachedData = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
        if (ilceAd) {
            return cachedData.filter(e => trToEn(e.district) === trToEn(ilceAd));
        }
        return cachedData;
    }

    // 2. YERELDE YOKSA NOSYAPI'DEN ÇEK
    try {
        console.log(`[NOSY-API] ${sehir} için yeni veri çekiliyor...`);
        const url = `https://www.nosyapi.com/apiv2/service/pharmacies-on-duty?city=${encodeURIComponent(sehir)}`;
        
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        if (response.data && response.data.status === "success") {
            const result = response.data.data || [];
            
            // Veriyi Yerel Depoya Yaz (Cache)
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            
            if (ilceAd) {
                return result.filter(e => trToEn(e.district) === trToEn(ilceAd));
            }
            return result;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.message);
        return [];
    }
}

// Rotalar
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const veriler = await getEczaneler(req.params.il, req.params.ilce || "");
        const formatli = veriler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone.replace(/\D/g, ''),
            ilce: e.district.toUpperCase(),
            maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.name + ' Eczanesi ' + e.address)}`
        }));
        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: formatli });
    } catch (err) {
        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: [] });
    }
});

// Manuel temizleme rotası (Önemli!)
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Depo temizlendi. Yeni sorgular en güncel veriyi çekecek.");
});

app.get('/', (req, res) => res.render('index', { title: 'Eczane360' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

// Hakkımızda, KVKK ve İletişim rotaları
app.get('/hakkimizda', (req, res) => res.render('hakkimizda', { title: 'Hakkımızda' }));
app.get('/kvkk', (req, res) => res.render('kvkk', { title: 'KVKK' }));
app.get('/iletisim', (req, res) => res.render('iletisim', { title: 'İletişim' }));

app.listen(process.env.PORT || 8080, () => console.log("Eczane360 Yayında!"));
