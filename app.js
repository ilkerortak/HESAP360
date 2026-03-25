const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// KURUMSAL VERİ SETİ
const financeData = {
    banks: [
        { id: 1, ad: 'Enpara', krediOran: 3.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Enpara_Logo.png' },
        { id: 2, ad: 'Akbank', krediOran: 4.10, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Akbank_logo.svg/2560px-Akbank_logo.svg.png' },
        { id: 3, ad: 'Garanti BBVA', krediOran: 3.99, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Garanti_BBVA_logo.svg/2560px-Garanti_BBVA_logo.svg.png' },
        { id: 4, ad: 'QNB', krediOran: 3.85, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/QNB_Finansbank_Logo.svg/1024px-QNB_Finansbank_Logo.svg.png' }
    ]
};

app.get('/', (req, res) => res.render('index'));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/kredi', (req, res) => res.render('kredi', { banks: financeData.banks }));
app.get('/bilgi/:sayfa', (req, res) => {
    const sayfa = req.params.sayfa;
    const titles = { 'hakkimizda': 'Hakkımızda', 'kvkk': 'KVKK', 'kosullar': 'Koşullar', 'iletisim': 'İletişim' };
    res.render('bilgi', { sayfa, baslik: titles[sayfa] || 'Bilgi' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Hesap360 Yeni Arayüzle Yayında!`));
