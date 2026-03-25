const cron = require('node-cron');
const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();

// --- AYARLAR ---
const NOSY_TOKEN = 'CSsas9Y81PH7hgA3I1n6n3AHgKSQW32fmndxsNWSqzaHARVAorMP5rJyJ5oK'; 
const BASE_URL = 'https://www.nosyapi.com/apiv2/service/pharmacies-on-duty';

const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

const normalizeText = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
};

async function getEczaneler(sehir, ilce = "") {
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${normalizeText(sehir)}_${normalizeText(ilce)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    if (fs.existsSync(dosyaYolu)) return JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));

    try {
        let url = `${BASE_URL}?city=${encodeURIComponent(sehir.toLowerCase())}`;
        if (ilce) url += `&district=${encodeURIComponent(ilce.toLowerCase())}`;

        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        const result = response.data.data || [];
        if (result.length > 0) {
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            return result;
        }
        return [];
    } catch (error) {
        return [];
    }
}

// --- OTOMATİK TEMİZLİK (SABAH 09:00) ---
cron.schedule('0 9 * * *', () => {
    if (fs.existsSync(dataFolder)) {
        try {
            const files = fs.readdirSync(dataFolder);
            for (const file of files) {
                fs.unlinkSync(path.join(dataFolder, file));
            }
            console.log("Sabah temizliği yapıldı.");
        } catch (err) {
            console.error("Temizlik hatası:", err);
        }
    }
}, { timezone: "Europe/Istanbul" });

// --- ROTALAR ---

// ANA SAYFA (Hatanın kaynağı burası olabilir, en üste aldım)
app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360 | Nöbetçi Eczaneler' });
});

// ECZANE LİSTESİ
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";
    try {
        const hamVeriler = await getEczaneler(il, ilceReq);
        const formatli = hamVeriler.map(e => ({
            ad: (e.pharmacyName || e.name || "Bilinmiyor").toUpperCase(),
            adres: e.address || "Adres bilgisi yok",
            tel: (e.phone || "").toString().replace(/\D/g, ''),
            ilce: (e.district || il).toUpperCase()
        }));
        res.render('liste', { il: il.toUpperCase(), eczaneler: formatli, title: `${il.toUpperCase()} Nöbetçi Eczaneler` });
    } catch (err) {
        res.render('liste', { il: il.toUpperCase(), eczaneler: [], title: 'Hata' });
    }
});

// DİĞER SAYFALAR
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Depo sıfırlandı.");
});

app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

// SUNUCU BAŞLATMA
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Eczane360 ${PORT} portunda aktif!`);
});
