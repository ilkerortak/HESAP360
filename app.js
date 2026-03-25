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

// Filtreleme için temizlik
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

        const result = response.data.data || [];
        if (result.length > 0) {
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            return result;
        }
        return [];
    } catch (error) {
        console.error("API Hatası:", error.message);
        return [];
    }
}

// --- ANA ROTA ---
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";

    try {
        const hamVeriler = await getEczaneler(il);
        
        let formatli = hamVeriler.map(e => {
            // SÜPER YAKALAYICI: API'den ne gelirse gelsin ismi ve adresi bulur
            const ad = e.name || e.EczaneAdi || e.Ad || e.Name || e.eczaneadi || e.title || "ECZANE";
            const adres = e.address || e.Adresi || e.Adres || e.Address || e.adresi || "Adres Bulunamadı";
            const tel = (e.phone || e.Telefon || e.telefon || e.Phone || "").replace(/\D/g, '');
            const eczaneIlce = e.dist || e.district || e.IlceAd || e.District || il;

            return {
                ad: ad.toUpperCase(),
                adres: adres,
                tel: tel,
                ilce: eczaneIlce.toUpperCase()
            };
        });

        if (ilceReq) {
            const filtrelenmis = formatli.filter(e => normalizeText(e.ilce) === normalizeText(ilceReq));
            if (filtrelenmis.length > 0) formatli = filtrelenmis;
        }

        res.render('liste', { 
            il: il.toUpperCase(), 
            eczaneler: formatli,
            title: `${il.toUpperCase()} Nöbetçi Eczaneler`
        });

    } catch (err) {
        res.render('liste', { il: il.toUpperCase(), eczaneler: [], title: 'Hata' });
    }
});

// Cache temizleme
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Depo Sıfırlandı! Şimdi sayfaları yenileyebilirsin.");
});

// Diğer Sayfalar
app.get('/', (req, res) => res.render('index', { title: 'Eczane360' }));
app.get('/hakkimizda', (req, res) => res.render('hakkimizda', { title: 'Hakkımızda' }));
app.get('/kvkk', (req, res) => res.render('kvkk', { title: 'KVKK' }));
app.get('/iletisim', (req, res) => res.render('iletisim', { title: 'İletişim' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Eczane360 Port ${PORT} üzerinde devrede.`));
