const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs'); // Dosya sistemi entegre edildi

const app = express();
const myCache = new NodeCache({ stdTTL: 3600 }); 
const API_KEY = 'apikey 7wJjAEEMSukKl5nldRYtXC:6GY6N50VmT4y8dke6TWkyu'; 

// Veri depolama klasörünü kontrol et yoksa oluştur
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// Karakter temizleme (API ve Filtreleme uyumu için)
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
    const bugun = new Date().toISOString().split('T')[0]; // Örn: 2026-03-25
    const dosyaAdi = `${trToEn(sehir)}_${bugun}.json`;
    const dosyaYolu = path.join(dataFolder, dosyaAdi);

    // 1. ADIM: DOSYADAN OKU (Günde 1 kereden fazla API harcamaz)
    if (fs.existsSync(dosyaYolu)) {
        try {
            console.log(`[DEPO] ${sehir} verisi yerel dosyadan sunuluyor.`);
            const dosyaVerisi = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
            
            if (ilceAd) {
                return dosyaVerisi.filter(e => trToEn(e.dist) === trToEn(ilceAd) || (trToEn(ilceAd) === "adapazari" && trToEn(e.dist) === "merkez"));
            }
            return dosyaVerisi;
        } catch (e) {
            console.error("Dosya okuma hatası, API'ye gidiliyor...");
        }
    }

    // 2. ADIM: API'DEN ÇEK (Eğer o günün dosyası yoksa)
    try {
        console.log(`[API] ${sehir} için bugünün verisi çekiliyor...`);
        // API'ye sadece şehir soruyoruz (En sağlam yöntem)
        const url = `https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(sehir)}`;

        const response = await axios.get(url, {
            headers: { 
                'authorization': API_KEY,
                'content-type': 'application/json'
            }
        });

        if (response.data && response.data.success) {
            const result = response.data.result || [];
            
            // Veriyi dosyaya kaydet (Yarından önce bir daha API'ye gitmez)
            fs.writeFileSync(dosyaYolu, JSON.stringify(result));
            console.log(`[BAŞARI] ${sehir} verisi kaydedildi.`);

            if (ilceAd) {
                return result.filter(e => trToEn(e.dist) === trToEn(ilceAd) || (trToEn(ilceAd) === "adapazari" && trToEn(e.dist) === "merkez"));
            }
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
        const ilRaw = req.params.il;
        const ilceRaw = req.params.ilce || "";
        
        const veriler = await getEczaneler(ilRaw, ilceRaw);
        
        const formatliEczaneler = veriler.map(e => ({
            ad: e.name.toUpperCase(),
            adres: e.address,
            tel: e.phone.replace(/\D/g, ''),
            ilce: e.dist.toUpperCase()
        }));

        const baslik = ilceRaw ? `${ilRaw.toUpperCase()} / ${ilceRaw.toUpperCase()}` : ilRaw.toUpperCase();
        res.render('liste', { il: baslik, eczaneler: formatliEczaneler });
    } catch (err) {
        res.render('liste', { il: "HATA", eczaneler: [] });
    }
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360' });
});

app.get('/temizle', (req, res) => {
    if (fs.existsSync(dataFolder)) {
        fs.rmSync(dataFolder, { recursive: true, force: true });
        fs.mkdirSync(dataFolder);
        return res.send("✅ Depo boşaltıldı! Şimdi sayfayı yenileyip taze veriyi çekebilirsin.");
    }
    res.send("Zaten depo boş.");
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 8080;
app.get('/hakkimizda', (req, res) => { res.render('hakkimizda', { title: 'Hakkımızda' }); });
app.get('/kvkk', (req, res) => { res.render('kvkk', { title: 'KVKK' }); });
app.get('/iletisim', (req, res) => { res.render('iletisim', { title: 'İletişim' }); });
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`Eczane360 SİSTEMİ PORT ${PORT} ÜZERİNDE AKTİF`);
    console.log(`Günlük Kota Koruması: DEVREDE`);
    console.log(`-------------------------------------------`);
});
