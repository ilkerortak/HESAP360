const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Gerçekçi Banka ve Piyasa Verileri
const marketData = {
    rates: { usd: "32.45", eur: "35.12", gold: "2450" },
    banks: [
        { name: 'Enpara', loanRate: 3.75, depositRate: 48, logo: '🏦' },
        { name: 'Akbank', loanRate: 4.10, depositRate: 52, logo: '🔴' },
        { name: 'Garanti', loanRate: 3.99, depositRate: 45, logo: '🟢' },
        { name: 'QNB', loanRate: 3.85, depositRate: 50, logo: '🔵' }
    ]
};

app.get('/', (req, res) => res.render('index', { data: marketData }));
app.get('/kredi', (req, res) => res.render('kredi', { banks: marketData.banks }));
app.get('/mevduat', (req, res) => res.render('mevduat', { banks: marketData.banks }));
app.get('/kredi-limit', (req, res) => res.render('kredi-limit'));
app.get('/kredi-karti', (req, res) => res.render('kredi-karti'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('H360 Engine v4.0 Online'));
