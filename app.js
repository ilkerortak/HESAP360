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

// --- TEMİZLİK FONKSİYONU ---
function temizleData() {
    if (fs.existsSync(dataFolder)) {
        try {
            const files = fs.readdirSync(dataFolder);
            files.forEach(file => fs.unlinkSync(path.join(dataFolder, file)));
            console.log("Otomatik temizlik yapıldı.");
        } catch (err) {
            console.error("Temizlik hatası:", err);
        }
    }
}

// OTOMATİK KONTROL (Sabah 09:00 kontrolü)
setInterval(() => {
    const simdi = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
    if (simdi === "09:00") {
        temizleData();
    }
}, 1000 * 60); // Her dakika kontrol etmek daha garantidir

// --- ROTALAR ---

// Ana Sayfa
app.get('/', (req, res) => res.render('index', { title: 'Eczane360 | Türkiye Nöbetçi Eczaneler' }));

// Hakkımızda Sayfası
app.get('/hakkimizda', (req, res) => {
    res.render('hakkimizda', { title: 'Hakkımızda | Eczane360' });
});

// KVKK Sayfası
app.get('/kvkk', (req, res) => {
    res.render('kvkk', { title: 'KVKK | Eczane360' });
});

// İletişim Sayfası
app.get('/iletisim', (req, res) => {
    res.render('iletisim', { title: 'İletişim | Eczane360' });
});

// Eczane Listeleme
app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";
    try {
        let url = `${BASE_URL}?city=${encodeURIComponent(il.toLowerCase())}`;
        if (ilceReq) url += `&district=${encodeURIComponent(ilceReq.toLowerCase())}`;

        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` } });
        const hamVeriler = response.data.data || [];
        
        const formatli = hamVeriler.map(e => ({
            ad: (e.pharmacyName || e.EczaneAd || "Bilinmiyor").toUpperCase(),
            adres: e.address || e.Adresi || "Adres yok",
            tel: (e.phone || e.Telefon || "").toString().replace(/\D/g, ''),
            ilce: (e.district || e.ilce || il).toUpperCase()
        }));

        res.render('liste', { il: il.toUpperCase(), eczaneler: formatli, title: il.toUpperCase() });
    } catch (err) {
        res.render('liste', { il: il.toUpperCase(), eczaneler: [], title: 'Hata' });
    }
});

// Temizlik Rotası
app.get('/temizle', (req, res) => {
    temizleData();
    res.send("✅ Manuel temizlendi.");
});

// Reklam ve Doğrulama
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Sistem hazır: Port ${PORT}`));
