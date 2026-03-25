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
        // Alternatif ve daha stabil olan link (Rehber sayfası)
        const url = 'https://www.sakarya.bel.tr/tr/EBelediye/NobetciEczaneler';
        
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const list = [];

        // Sakarya Belediye sitesinde veriler bazen <tbody> içinde bazen direkt <tr> içindedir
        $('tr').each((i, el) => {
            const cells = $(el).find('td');
            if (cells.length >= 3) {
                const ad = $(cells[0]).text().trim();
                const adres = $(cells[1]).text().trim();
                const tel = $(cells[2]).text().trim().replace(/\D/g, ''); // Sadece rakamlar
                const ilce = $(cells[3]).text().trim();

                // Başlık satırı ve boşluk kontrolü
                if (ad && ad.length > 2 && !ad.toLowerCase().includes("eczane adı")) {
                    list.push({
                        ad: ad.toUpperCase(),
                        adres: adres,
                        tel: tel.startsWith('0') ? tel : '0' + tel,
                        ilce: ilce || 'Sakarya'
                    });
                }
            }
        });

        // Eğer hala boşsa, belediyenin farklı bir CSS yapısını (div-tabanlı) kontrol et
        if (list.length === 0) {
            $('.nobetci-item, .pharmacy-item').each((i, el) => {
                const ad = $(el).find('.title, h4').text().trim();
                const adres = $(el).find('.address, p').first().text().trim();
                const tel = $(el).find('.phone, .tel').text().trim().replace(/\D/g, '');
                if (ad) list.push({ ad: ad.toUpperCase(), adres, tel: '0' + tel.replace(/^0/, ''), ilce: 'Sakarya' });
            });
        }

        // GERÇEK VERİ GELİRSE YEDEKLERİ SİL
        if (list.length > 0) return list;

        // VERİ GELMEZSE (SADECE O ZAMAN YEDEK)
        return [
            { ad: "VERİ BAĞLANTISI BEKLENİYOR", adres: "Lütfen 1 dakika sonra sayfayı yenileyin.", tel: "02640000000", ilce: "Sistem" }
        ];

    } catch (error) {
        console.error("Scraper Hatası:", error.message);
        return [{ ad: "SİSTEM MEŞGUL", adres: "Belediye sunucusu şu an cevap vermiyor.", tel: "0", ilce: "Hata" }];
    }
}

app.get('/', (req, res) => {
    res.render('index', { title: 'Ana Sayfa' });
});

app.get('/eczaneler/sakarya', async (req, res) => {
    const eczaneler = await getSakaryaEczaneler();
    res.render('liste', { il: 'Sakarya', eczaneler });
});

app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sakarya Canlı Veri Motoru Yayında!`));
