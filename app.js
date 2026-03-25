const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/kredi', (req, res) => { res.render('kredi'); });
app.get('/kredi-limit', (req, res) => { res.render('kredi-limit'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Hesap360 yayında: ${PORT}`); });
