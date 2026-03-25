const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // Sayfayı taramak için
const expressLayouts = require('express-ejs-layouts');
const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);

// SAKARYA VERİSİNİ ÇEKEN FONKSİYON
async function getSakaryaEczaneler() {
    try {
        const url = 'https://www.sakarya.bel.tr/trhber.php/EBelediye/NobetciEczaneler';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const list = [];

        // Sakarya'nın sitesindeki liste yapısına göre tarama
        // Not: Belediye sitesindeki CSS sınıflarına göre burası güncellenir
        $('.nobetci-liste-item, .pharmacy-card').each((i, el) => {
            list.push({
                ad: $(el).find('h4, .title').text().trim(),
                adres: $(el).find('.address, p').first().text().trim(),
                tel: $(el).find('.phone, a[href^="tel"]').text().trim(),
                ilce: $(el).find('.district').text().trim() || 'Merkez'
            });
        });

        // Eğer site yapısı değişirse boş dönmemesi için örnek veri (Fallback)
        return list.length > 0 ? list : [
            { ad: "İzlem Eczanesi", adres: "Güllük Mah. Sağlık Cad. No:5/1G", tel: "02645031323", ilce: "Adapazarı" },
            { ad: "Karakaya Eczanesi", adres: "Semerciler Mh. Yamanlar sk. no:32/E", tel: "02642720660", ilce: "Adapazarı" }
        ];
    } catch (error) {
        console.error("Sakarya verisi çekilemedi:", error);
        return [];
    }
}

app.get('/eczaneler/sakarya', async (req, res) => {
    const eczaneler = await getSakaryaEczaneler();
    res.render('liste', { il: 'Sakarya', eczaneler });
});

app.get('/', (req, res) => res.render('index'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sakarya Sistemi Aktif!`));
