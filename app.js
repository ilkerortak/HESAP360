const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();

// --- KONFİGÜRASYON ---
const NOSY_TOKEN = 'CSsas9Y81PH7hgA3I1n6n3AHgKSQW32fmndxsNWSqzaHARVAorMP5rJyJ5oK'; 
const BASE_URL = 'https://www.nosyapi.com/apiv2/service/pharmacies-on-duty';

const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

// --- YARDIMCI FONKSİYONLAR ---
const normalizeText = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .trim();
};

async function getEczaneler(sehir, ilceAd = "") {
    // Türkiye saati ile tarih (Örn: 2026-03-25)
    const bugun = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }).split('.').reverse().join('-');
    const dosyaAdi = `${normalizeText(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    // 1. ÖNCE YEREL CACHE KONTROLÜ
    if (fs.existsSync(dosyaYolu)) {
        console.log(`[YEREL] ${sehir} verisi dosyadan okundu.`);
        return JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
    }

    // 2. YERELDE YOKSA NOSYAPI'YE GİT
    try {
        console.log(`[API-CALL] ${sehir} için NosyAPI çağrılıyor...`);
        const url = `${BASE_URL}?city=${encodeURIComponent(sehir.toLowerCase())}`;
        
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${NOSY_TOKEN}` }
        });

        // NosyAPI veri yapısı genellikle response.data.data içindedir
        const result = response.data.data || [];
        
        if (result.length > 0) {
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            return result;
        }
        return [];
    } catch (error) {
        console.error("Bağlantı Hatası:", error.message);
        return [];
    }
}

// --- ROTALAR ---

app.get('/eczaneler/:il/:ilce?', async (req, res) => {
    const il = req.params.il;
    const ilceReq = req.params.ilce || "";

    try {
        const hamVeriler = await getEczaneler(il);
        
        // NosyAPI'den gelen veriyi bizim listeye uygun hale getiriyoruz (Mapping)
        let formatli = hamVeriler.map(e => {
            // API'nin tüm ihtimallerini kontrol et (name, EczaneAdi, Adresi, vb.)
            const ad = e.name || e.EczaneAdi || e.eczaneAdi || "BİLİNMİYOR";
            const adres = e.address || e.Adresi || e.adresi || "ADRES BİLGİSİ YOK";
            const tel = (e.phone || e.phoneLine || e.Telefon || e.telefon || "").replace(/\D/g, '');
            const eczaneIlce = e.dist || e.district || e.ilceAd || e.IlceAd || il;

            return {
                ad: ad.toUpperCase(),
                adres: adres,
                tel: tel,
                ilce: eczaneIlce.toUpperCase()
            };
        });

        // Eğer kullanıcı ilçe seçtiyse filtrele
        if (ilceReq) {
            const filtrelenmis = formatli.filter(e => normalizeText(e.ilce) === normalizeText(ilceReq));
            // Filtreleme sonucu boşsa tüm ili göster (kullanıcıyı boş sayfada bırakmamak için)
            if (filtrelenmis.length > 0) formatli = filtrelenmis;
        }

        res.render('liste', { 
            il: il.toUpperCase(), 
            eczaneler: formatli,
            title: `${il.toUpperCase()} Nöbetçi Eczaneler`
        });

    } catch (err) {
        console.error(err);
        res.render('liste', { il: il.toUpperCase(), eczaneler: [], title: 'Hata' });
    }
});

// Manuel temizleme rotası (Hata durumunda mutlaka çalıştır)
app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
    }
    res.send("✅ Sistem Önbelleği Sıfırlandı! Şimdi tekrar sorgu yapabilirsiniz.");
});

// Sayfa Rotaları
app.get('/', (req, res) => res.render('index', { title: 'Eczane360 | Nöbetçi Eczane Bul' }));
app.get('/hakkimizda', (req, res) => res.render('hakkimizda', { title: 'Hakkımızda' }));
app.get('/kvkk', (req, res) => res.render('kvkk', { title: 'KVKK' }));
app.get('/iletisim', (req, res) => res.render('iletisim', { title: 'İletişim' }));
app.get('/ads.txt', (req, res) => res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0'));

// Sunucuyu Başlat
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Eczane360 Yayında: Port ${PORT}`));
