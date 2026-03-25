const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Görünüm Motoru Ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

// Ana Sayfa Rotası
app.get('/', (req, res) => {
    res.render('index');
});

// Araç Maliyet Sayfası
app.get('/arac-maliyet', (req, res) => {
    res.render('arac-maliyet');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bi'Maliyet Yayında: http://localhost:${PORT}`));
