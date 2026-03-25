const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(path.join(__dirname, 'public')));

// SAKARYA VERİSİNİ ANLIK ÇEKEN FONKSİYON
async function getSakaryaEczaneler() {
    try {
        // En güncel veri linki
        const url = 'https://www.sakarya.bel.tr/tr/EBelediye/NobetciEczaneler';
        
        // Bot engeline takılmamak için gelişmiş header
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache'
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);
        const list = [];

        // Sakarya Belediye sitesindeki tabloyu (hem .table hem table) tarıyoruz
        $('table tr, .table tr, .table-responsive tr').each((i, el) => {
            const cells = $(el).find('td');
            
            if (cells.length >= 3) {
                const adRaw = $(cells[0]).text().trim();
                const adresRaw = $(cells[1]).text().trim();
                const telRaw = $(cells[2]).text().trim().replace(/\D/g, ''); // Sadece rakamları al
                const ilceRaw = $(cells[3]).text().trim() || 'Sakarya';

                // Başlıkları ve boş satırları ele
                if (adRaw && adRaw.length > 3 && !adRaw.includes("Eczane Adı")) {
                    list.push({
                        ad: adRaw.toUpperCase(),
                        adres: adresRaw,
                        // Telefonun başına 0 ekle (yoksa)
                        tel: telRaw.startsWith('0') ? telRaw : '0' + telRaw,
                        ilce: ilceRaw
                    });
                }
            }
        });

        // EĞER LİSTE BOŞSA (Fallback - Yedek)
        if (list.length === 0) {
            console.log("Canlı veri boş döndü, yedekler yükleniyor...");
            return [
                { ad: "İzlem Eczanesi (Sistem Bakımda)", adres: "Güllük Mah. Sağlık Cad. No:5/1G", tel: "02645031323", ilce: "Adapazarı" },
                { ad: "Karakaya Eczanesi (Sistem Bakımda)", adres: "Semerciler Mh. Yamanlar sk. no:32/E", tel: "02642720660", ilce: "Adapazarı" }
            ];
        }

        return list;
    } catch (error) {
        console.error("Hata:", error.message);
        return [];
    }
}

// ROTALAR
app.get('/', (req, res) => {
    res.render('index', { title: 'Ana Sayfa' });
});

app.get('/eczaneler/sakarya', async (req, res) => {
    const eczaneler = await getSakaryaEczaneler();
    res.render('liste', { il: 'Sakarya', eczaneler });
});

// ADSENSE DOĞRULAMASI
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sakarya Sistemi v2.1 Aktif - Port: ${PORT}`));
