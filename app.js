const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// 2026 GÜNCEL BANKA VE PİYASA VERİLERİ (API ALTYAPISI)
const bankInventory = {
    rates: { usd: "32.45", eur: "35.12", gold: "2.450" },
    kredi: [
        { ad: 'Enpara', oran: 3.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Enpara_Logo.png' },
        { ad: 'Akbank', oran: 4.10, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Akbank_logo.svg/2560px-Akbank_logo.svg.png' },
        { ad: 'Garanti BBVA', oran: 3.99, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Garanti_BBVA_logo.svg/2560px-Garanti_BBVA_logo.svg.png' },
        { ad: 'QNB Finansbank', oran: 3.85, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/QNB_Finansbank_Logo.svg/1024px-QNB_Finansbank_Logo.svg.png' }
    ],
    mevduat: [
        { ad: 'Alternatif Bank', oran: 52, logo: 'https://www.alternatifbank.com.tr/resources/images/logo.png' },
        { ad: 'Odea', oran: 49, logo: 'https://www.odeabank.com.tr/SiteAssets/images/header-logo.png' },
        { ad: 'N Kolay', oran: 50, logo: 'https://www.nkolay.com/assets/images/logo.png' }
    ]
};

app.get('/', (req, res) => res.render('index', { data: bankInventory }));
app.get('/kredi', (req, res) => res.render('kredi', { banks: bankInventory.kredi }));
app.get('/mevduat', (req, res) => res.render('mevduat', { banks: bankInventory.mevduat }));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('H360 Professional v4.0 Online'));
