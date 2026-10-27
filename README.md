# Review Card Maker (NFC + QR)

Google review link se **QR code**, **print-ready NFC card** (85.6 × 54 mm) aur **NFC tag writer**. Sab browser me chalta hai, koi server nahi.

## Kya hai is repo me

| Path | Kaam |
| --- | --- |
| `index.html`, `assets/` | Web tool (GitHub Pages par chalta hai) |
| `python/generate_qr.py` | Command line se QR PNG + SVG banane ki script |

## 1. Review link kahan se milegi
`business.google.com` -> apni profile -> **Ask for reviews** -> link copy karo (jaise `https://g.page/r/XXXX/review`).

## 2. Web tool chalana
- Online: GitHub Pages link kholo (niche steps).
- Local: folder me `npx serve .` ya `python -m http.server 8000`, phir `http://localhost:8000`.

Tool me business ka naam, link, rang bharo. Phir:
- **QR PNG / QR SVG**: download karo.
- **Card print / PDF**: print dialog me *Save as PDF*, scale **100%**. PDF print shop ko do.
- **NFC tag me likho**: sirf Chrome (Android) + NFC ON. Button dabao, phir card phone ke peeche touch karo.

## 3. NFC me link likhne ke baaki tareeke
Agar Web NFC nahi chal raha (iPhone, ya Chrome nahi), to **NFC Tools** app:
1. Write -> Add a record -> URL/URI -> link paste karo
2. Write dabao, card phone se touch karo
3. Tap karke test karo. Sab theek ho tabhi tag ko *read-only* lock karna (wapas nahi badal sakte).

Card kharidte waqt **NTAG213 / NTAG215 / NTAG216** chip lo. Metal par chipkana ho to anti-metal tag lo.

## 4. Python script
```bash
cd python
pip install -r requirements.txt
python generate_qr.py "https://g.page/r/XXXX/review" --out my-shop --color "#0f766e"
```
`my-shop.png` aur `my-shop.svg` ban jayenge.

## 5. GitHub par push karna
```bash
cd review-card
git init -b main
git add .
git commit -m "feat: review card maker (QR + NFC)"
git remote add origin https://github.com/YOUR-USERNAME/review-card.git
git push -u origin main
```
(GitHub par pehle khali repo `review-card` banao, README/.gitignore mat jodna.)

## 6. GitHub Pages par host karna
Repo -> **Settings -> Pages -> Build and deployment -> Deploy from a branch -> `main` / `(root)` -> Save**.
1-2 minute baad link milegi: `https://YOUR-USERNAME.github.io/review-card/`

Pehle se bhari hui link ke saath kholne ke liye: `.../review-card/?link=https://g.page/r/XXXX/review&name=Mera%20Shop`

## Dhyan rakho
- NFC card ke saath QR hamesha rakho: kuch phones me NFC nahi hota.
- Review ke badle discount/gift mat do aur sirf achhe customers ko review ke liye mat bhejo (Google ke rules).
- Print se pehle QR ko phone se scan karke test karo.
