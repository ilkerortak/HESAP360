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

async function getSakaryaEczaneler() {
    try {
        // YENİ KAYNAK: Sakarya Eczacı Odası Nöbetçi Listesi
        const url = 'https://www.seo.org.tr/nobetci-eczaneler';
        
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://www.seo.org.tr/'
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const list = [];

        // SEO sitesindeki eczane kartlarını hedefliyoruz
        // Not: Sitenin HTML yapısına göre .panel veya .card yapılarını tarar
        $('.nobetci-eczane, .panel-default, tr').each((i, el) => {
            const ad = $(el).find('h4, strong, .eczane-adi').first().text().trim();
            const adres = $(el).find('.adres, p').text().trim();
            let tel = $(el).find('.telefon, a[href^="tel"]').text().trim().replace(/\D/g, '');

            if (ad && ad.length > 3 && !ad.toLowerCase().includes("eczane adı")) {
                list.push({
                    ad: ad.toUpperCase(),
                    adres: adres.replace(/\t|\n/g, ' '), // Fazla boşlukları temizle
                    tel: tel.startsWith('0') ? tel : '0' + tel,
                    ilce: 'Sakarya'
                });
            }
        });

        // Eğer hala boşsa, alternatif bir API veya JSON kaynağı denebilir (Şimdilik yedek mesajı)
        if (list.length === 0) {
            return [{ ad: "GÜNCELLEME YAPILIYOR", adres: "Eczacı Odası verileri çekiliyor, lütfen az sonra tekrar deneyin.", tel: "0", ilce: "Sistem" }];
        }

        return list;
    } catch (error) {
        console.error("Hata:", error.message);
        return [{ ad: "BAĞLANTI HATASI", adres: "Veri kaynağına şu an ulaşılamıyor.", tel: "0", ilce: "Hata" }];
    }
}

app.get('/', (req, res) => {
    res.render('index', { title: 'Eczane360 | Ana Sayfa' });
});

app.get('/eczaneler/sakarya', async (req, res) => {
    const eczaneler = await getSakaryaEczaneler();
    res.render('liste', { il: 'Sakarya', eczaneler });
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Eczacı Odası Motoru Aktif!`));
