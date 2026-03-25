const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// KURUMSAL BANKA VERİLERİ (HEM KREDİ HEM MEVDUAT İÇİN)
const banks = [
    { id: 1, ad: 'Enpara', kredi: 3.75, mevduat: 45, logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Enpara_Logo.png' },
    { id: 2, ad: 'Akbank', kredi: 4.10, mevduat: 42, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Akbank_logo.svg/2560px-Akbank_logo.svg.png' },
    { id: 3, ad: 'Garanti', kredi: 3.99, mevduat: 40, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Garanti_BBVA_logo.svg/2560px-Garanti_BBVA_logo.svg.png' },
    { id: 4, ad: 'QNB', kredi: 3.85, mevduat: 44, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/QNB_Finansbank_Logo.svg/1024px-QNB_Finansbank_Logo.svg.png' }
];

// ROTALAR
app.get('/', (req, res) => res.render('index'));
app.get('/kredi', (req, res) => res.render('kredi', { banks }));
app.get('/mevduat', (req, res) => res.render('mevduat', { banks }));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));

app.get('/bilgi/:sayfa', (req, res) => {
    const titles = { 'hakkimizda': 'Hakkımızda', 'kvkk': 'KVKK Politikası', 'kosullar': 'Kullanım Koşulları', 'iletisim': 'İletişim' };
    res.render('bilgi', { sayfa: req.params.sayfa, baslik: titles[req.params.sayfa] || 'Bilgi Merkezi' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Hesap360 Çalışıyor: http://localhost:${PORT}`));
