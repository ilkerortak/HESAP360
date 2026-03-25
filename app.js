const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Rotalar - HangiKredi & HesapKurdu Modülleri
app.get('/', (req, res) => res.render('index'));
app.get('/kredi', (req, res) => res.render('kredi'));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/mevduat', (req, res) => res.render('mevduat'));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Hesap360 Master Engine Aktif: ${PORT}`));
