const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// KURUMSAL BANKA VERİLERİ
const banks = [
    { id: 1, ad: 'Enpara', kredi: 3.75, mevduat: 45, logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Enpara_Logo.png' },
    { id: 2, ad: 'Akbank', kredi: 4.10, mevduat: 42, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Akbank_logo.svg/2560px-Akbank_logo.svg.png' },
    { id: 3, ad: 'Garanti', kredi: 3.99, mevduat: 40, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Garanti_BBVA_logo.svg/2560px-Garanti_BBVA_logo.svg.png' }
];

app.get('/', (req, res) => res.render('index'));
app.get('/kredi', (req, res) => res.render('kredi', { banks }));
app.get('/mevduat', (req, res) => res.render('mevduat', { banks }));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/bilgi/:sayfa', (req, res) => {
    const titles = { 'hakkimizda': 'Hakkımızda', 'kvkk': 'KVKK', 'kosullar': 'Koşullar', 'iletisim': 'İletişim' };
    res.render('bilgi', { sayfa: req.params.sayfa, baslik: titles[req.params.sayfa] || 'Bilgi' });
});

app.listen(3000, () => console.log('Hesap360 White Edition Yayında!'));
