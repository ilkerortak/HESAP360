const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();

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
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(sehir) {
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${normalizeText(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    if (fs.existsSync(dosyaYolu)) {
        return JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
    }

    try {
        const url = `${BASE_URL}?city=${encodeURIComponent(sehir.toLowerCase())}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        // NosyAPI bazen response.data.data.data (3 katman) gönderebiliyor
        let result = response.data.data || [];
        if (response.data.data && response.data.data.data) {
            result = response.data.data.data;
        }

        if (result.length > 0) {
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            return result;
        }
        return [];
    } catch (error) {
        return [];
    }
}

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";

    try {
        const hamVeriler = await getEczaneler(il);
        
        let formatli = hamVeriler.map(e => {
            // DİNAMİK YAKALAYICI: Objeyi tarayıp veriyi bulur
            return {
                ad: (e.name || e.EczaneAdi || e.Ad || e.Name || e.title || "ECZANE").toUpperCase(),
                adres: e.address || e.Adresi || e.Adres || e.Address || "Adres Bulunamadı",
                tel: (e.phone || e.Telefon || e.Phone || "").replace(/\D/g, ''),
                ilce: (e.dist || e.district || e.IlceAd || il).toUpperCase()
            };
        });

        if (ilceReq) {
            const filtrelenmis = formatli.filter(e => normalizeText(e.ilce) === normalizeText(ilceReq));
            if (filtrelenmis.length > 0) formatli = filtrelenmis;
        }

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
    res.send("✅ Temizlendi! Şimdi sayfayı yenile.");
});

// Diğer Sayfalar
app.get('/', (req, res) => res.render('index', { title: 'Eczane360' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

app.listen(process.env.PORT || 8080);
