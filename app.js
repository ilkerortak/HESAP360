const express = require('express');
const app = express();
const path = require('path');

// EJS ve Klasör Ayarları (Bu kısım kritik)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Rotalar
app.get('/', (req, res) => {
    res.render('index'); // 'index.ejs' dosyasını arar
});

app.get('/kredi-limit', (req, res) => {
    res.render('kredi-limit');
});

app.get('/kredi', (req, res) => {
    res.render('kredi');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hesap360 çalışıyor: ${PORT}`);
});
