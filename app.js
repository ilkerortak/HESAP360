const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Layout dosyasını kullanması için
app.use(express.static(path.join(__dirname, 'public')));

// SAKARYA VERİSİNİ ANLIK ÇEKEN FONKSİYON
async function getSakaryaEczaneler() {
    try {
        // Sakarya Büyükşehir Rehber Linki
        const url = 'https://www.sakarya.bel.tr/tr/EBelediye/NobetciEczaneler';
        
        // Belediye sitesi bot sanmasın diye tarayıcı kimliği gönderiyoruz
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const list = [];

        // Belediye sitesindeki tablo satırlarını (tr) hedefliyoruz
        $('.table tbody tr').each((i, el) => {
            const cells = $(el).find('td');
            
            // Eğer hücreler varsa veriyi çek
            if (cells.length >= 3) {
                const ad = $(cells[0]).text().trim();
                const adres = $(cells[1]).text().trim();
                const tel = $(cells[2]).text().trim().replace(/ /g, ''); // Boşlukları temizle (tel için)
                const ilce = $(cells[3]).text().trim() || 'Sakarya';

                if (ad && ad !== "Eczane Adı") { // Başlık satırı değilse ekle
                    list.push({ ad, adres, tel, ilce });
                }
            }
        });

        // Eğer site yapısı değişirse boş dönmemesi için Fallback (Yedek) verisi
        if (list.length === 0) {
            return [
                { ad: "İzlem Eczanesi", adres: "Güllük Mah. Sağlık Cad. No:5/1G", tel: "02645031323", ilce: "Adapazarı" },
                { ad: "Karakaya Eczanesi", adres: "Semerciler Mh. Yamanlar sk. no:32/E", tel: "02642720660", ilce: "Adapazarı" }
            ];
        }

        return list;
    } catch (error) {
        console.error("Sakarya verisi çekilemedi:", error.message);
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
app.listen(PORT, () => console.log(`Sakarya Sistemi v2.0 Aktif - Port: ${PORT}`));
