const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Merkezi Banka Verileri (HangiKredi gibi dinamik yapı)
const bankData = {
    kredi: [
        { ad: 'Enpara', oran: 3.75, masraf: 0, logo: 'https://img.icons8.com/color/96/bank.png' },
        { ad: 'Garanti BBVA', oran: 4.15, masraf: 500, logo: 'https://img.icons8.com/color/96/bank-building.png' },
        { ad: 'İş Bankası', oran: 3.99, masraf: 450, logo: 'https://img.icons8.com/color/96/museum.png' }
    ],
    mevduat: [
        { ad: 'Alternatif Bank', oran: 52, stopaj: 5 },
        { ad: 'Odea Bank', oran: 49, stopaj: 5 },
        { ad: 'Akbank', oran: 45, stopaj: 7.5 }
    ]
};

app.get('/', (req, res) => res.render('index'));
app.get('/kredi', (req, res) => res.render('kredi', { banks: bankData.kredi }));
app.get('/mevduat', (req, res) => res.render('mevduat', { banks: bankData.mevduat }));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Hesap360 v3.0 Master Engine Online'));
