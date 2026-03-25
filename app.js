const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Rotalar
app.get('/', (req, res) => res.render('index'));
app.get('/arac-maliyet', (req, res) => res.render('arac-maliyet'));
app.get('/yatirim-hesapla', (req, res) => res.render('yatirim-hesapla'));

app.listen(3000, () => console.log('BiMaliyet v1.0 Yayında!'));
