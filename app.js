const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// APPLE TARZI TASARIM VE DARK MODE İÇEREN HTML ŞABLONU
const layout = (content) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eczane360 | Nöbetçi Eczaneler</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        :root { --bg: #F5F5F7; --card: #FFFFFF; --text: #1D1D1F; --blue: #FF3B30; --border: #D2D2D7; }
        [data-theme="dark"] { --bg: #000000; --card: #1C1C1E; --text: #F5F5F7; --blue: #FF453A; --border: #38383A; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; margin: 0; transition: 0.3s; }
        nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 8%; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; }
        .logo { font-size: 1.4rem; font-weight: 900; color: var(--text); text-decoration: none; }
        .logo span { color: var(--blue); }
        .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: var(--card); border-radius: 22px; padding: 25px; border: 1px solid var(--border); box-shadow: 0 8px 30px rgba(0,0,0,0.04); margin-bottom: 20px; }
        select, button { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 1rem; margin-top: 10px; }
        button { background: var(--blue); color: white; border: none; font-weight: 700; cursor: pointer; }
        .mode-btn { width: auto; padding: 8px 15px; border-radius: 20px; font-size: 0.8rem; }
    </style>
</head>
<body data-theme="light">
    <nav>
        <a href="/" class="logo">ECZANE<span>360</span></a>
        <button class="mode-btn" onclick="toggleMode()">🌓 Görünüm</button>
    </nav>
    <div class="container">${content}</div>
    <script>
        function toggleMode() {
            const body = document.body;
            const theme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }
        document.body.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
    </script>
</body>
</html>
`;

// ANA SAYFA İÇERİĞİ
app.get('/', (req, res) => {
    const homeHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 2.5rem; letter-spacing: -1px;">En Yakın <span style="color:var(--blue)">Nöbetçi Eczane</span></h1>
            <p style="opacity: 0.6;">81 ilde anlık nöbetçi eczane listesi.</p>
        </div>
        <div class="glass-card">
            <select id="il"><option value="">İl Seçiniz</option><option value="istanbul">İstanbul</option><option value="sakarya">Sakarya</option></select>
            <select id="ilce"><option value="">İlçe Seçiniz</option></select>
            <button onclick="alert('Veri servisi bağlanıyor...')">Eczaneleri Bul</button>
        </div>
        <div class="glass-card" style="border-style: dashed; text-align: center; opacity: 0.5;">
            <small>GOOGLE ADSENSE REKLAM ALANI</small>
        </div>
    `;
    res.send(layout(homeHTML));
});

// ADS.TXT DOĞRULAMASI
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-1894587939365426, DIRECT, f08c47fec0942fa0');
});

app.listen(PORT, () => console.log(`Server ${PORT} üzerinde aktif.`));
