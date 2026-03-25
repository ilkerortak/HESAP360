const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();

// Ayarlar
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
    } catch (error) { return []; }
}

// Rotalar
app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360' });
});

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";
    try {
        const hamVeriler = await getEczaneler(il, ilceReq);
        const formatli = hamVeriler.map(e => ({
            ad: (e.pharmacyName || e.name || "Bilinmiyor").toUpperCase(),
            adres: e.address || "Adres bulunamadı",
            tel: (e.phone || "").toString().replace(/\D/g, ''),
            ilce: (e.district || il).toUpperCase()
        }));
        res.render('liste', { il: il.toUpperCase(), eczaneler: formatli, title: il.toUpperCase() });
    } catch (err) {
        res.render('liste', { il: il.toUpperCase(), eczaneler: [], title: 'Hata' });
    }
});

app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Temizlendi.");
});

// Otomatik Temizlik (Sabah 09:00)
cron.schedule('0 9 * * *', () => {
    if (fs.existsSync(dataFolder)) {
        fs.readdirSync(dataFolder).forEach(file => fs.unlinkSync(path.join(dataFolder, file)));
    }
}, { timezone: "Europe/Istanbul" });

// Sunucuyu başlat
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
