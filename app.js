const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();
// Senin NosyAPI Token'ın
const NOSY_TOKEN = 'CSsas9Y81PH7hgA3I1n6n3AHgKSQW32fmndxsNWSqzaHARVAorMP5rJyJ5oK'; 

const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

// Karakter temizleme (API ve Filtreleme uyumu için)
const normalizeText = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/i̇/g, 'i')
        .trim();
};

async function getEczaneler(sehir, ilceAd = "") {
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${normalizeText(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    // 1. ÖNCE YEREL CACHE KONTROLÜ
    if (fs.existsSync(dosyaYolu)) {
        console.log(`[CACHED] ${sehir} dosyadan okundu.`);
        const cachedData = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
        if (ilceAd) {
            const filtered = cachedData.filter(e => normalizeText(e.dist) === normalizeText(ilceAd));
            return filtered.length > 0 ? filtered : cachedData;
        }
        return cachedData;
    }

    // 2. YERELDE YOKSA NOSYAPI'DEN ÇEK
    try {
        console.log(`[NOSY-API] ${sehir} çekiliyor...`);
        // NosyAPI parametresi: city
        const url = `https://www.nosyapi.com/apiv2/service/pharmacies-on-duty?city=${encodeURIComponent(sehir.toLowerCase())}`;
        
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        // NosyAPI veri yapısı: response.data.data
        if (response.data && response.data.data) {
            const result = response.data.data;
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            
            if (ilceAd) {
                const filtered = result.filter(e => normalizeText(e.dist) === normalizeText(ilceAd));
                return filtered.length > 0 ? filtered : result;
            }
            return result;
        }
        return [];
    } catch (error) {
        console.error("API Bağlantı Hatası:", error.message);
        return [];
    }
}

// Ana Liste Rotası
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    try {
        const veriler = await getEczaneler(req.params.il, req.params.ilce || "");
        
        // NosyAPI'den gelen veriyi bizim listeye uygun map'liyoruz
        // NosyAPI field isimleri: name, address, phone, dist
        const formatli = veriler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone ? e.phone.replace(/\D/g, '') : '',
            ilce: e.dist ? e.dist.toUpperCase() : req.params.il.toUpperCase()
        }));

        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: formatli });
    } catch (err) {
        console.log(err);
        res.render('liste', { il: req.params.il.toUpperCase(), eczaneler: [] });
    }
} );

// Manuel temizleme (Mutlaka bunu çalıştır!)
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Depo temizlendi. Şimdi sayfayı yenileyip en güncel veriyi çekebilirsin.");
});

// Sayfa Rotaları
app.get('/', (req, res) => res.render('index', { title: 'Eczane360' }));
app.get('/hakkimizda', (req, res) => res.render('hakkimizda', { title: 'Hakkımızda' }));
app.get('/kvkk', (req, res) => res.render('kvkk', { title: 'KVKK' }));
app.get('/iletisim', (req, res) => res.render('iletisim', { title: 'İletişim' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

app.listen(process.env.PORT || 8080, () => console.log("Eczane360 Yayında!"));
