const express = require('express');
const path = require('path');
const app = express();

// Görünüm Motoru Ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Rotalar
app.get('/', (req, res) => {
    res.render('index', { title: 'Ana Sayfa' });
});

app.get('/arac-maliyet', (req, res) => {
    res.render('arac-maliyet', { title: 'Araç Maliyet Hesaplama' });
});

// AdSense ads.txt Doğrulaması İçin (Senin Yayıncı Kimliğinle)
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bi'Maliyet Yayında: http://localhost:${PORT}`));
