# Review Card Maker (NFC + QR)

Create a **QR code**, a **print-ready vertical NFC card** (54 × 85.6 mm), and write links to NFC tags. Everything runs in your browser; no server is used.

## What's in this repository

| Path | Purpose |
| --- | --- |
| `index.html`, `assets/` | Web tool (GitHub Pages par chalta hai) |
| `python/generate_qr.py` | Command line se QR PNG + SVG banane ki script |

## 1. Get your review link
Go to `business.google.com` → select your profile → **Ask for reviews** → copy your review link.

## 2. Run the web tool
- Online: open your GitHub Pages URL (see setup steps below).
- Locally: run `npx serve .` or `python -m http.server 8000`, then open `http://localhost:8000`.

Enter the business name, review link, and colors. Then:
- **QR PNG / QR SVG**: download the file.
- **Card print / PDF**: print dialog me *Save as PDF*, scale **100%**. Vertical card ka size 54 × 85.6 mm rakha gaya hai; PDF give the PDF to your print shop and confirm the final size and bleed.
- **NFC tag me likho**: requires Chrome on Android with NFC enabled. Click the button, then hold the card against the back of your phone.

## 3. Other ways to write an NFC tag
If Web NFC is unavailable (for example, on iPhone or desktop), use the **NFC Tools** app:
1. Write -> Add a record -> URL/URI -> link paste karo
2. Tap Write, then hold the card against your phone
3. Test the tag by tapping your phone against it. Only lock it as *read-only* after confirming it works; this cannot be undone.

When buying a card, choose an **NTAG213, NTAG215, or NTAG216** chip. Use an anti-metal tag if attaching it to metal.

## 4. Python script
```bash
cd python
pip install -r requirements.txt
python generate_qr.py "https://g.page/r/XXXX/review" --out my-shop --color "#0f766e"
```
`my-shop.png` and `my-shop.svg` will be created.

## 5. Push to GitHub
```bash
cd review-card
git init -b main
git add .
git commit -m "feat: review card maker (QR + NFC)"
git remote add origin https://github.com/YOUR-USERNAME/review-card.git
git push -u origin main
```
(First create an empty `review-card` repository on GitHub. Do not add a README or `.gitignore`.)

## 6. Host on GitHub Pages
Repo -> **Settings -> Pages -> Build and deployment -> Deploy from a branch -> `main` / `(root)` -> Save**.
After a minute or two, your site should be available at: `https://YOUR-USERNAME.github.io/review-card/`

To pre-fill the form with a link: `.../review-card/?link=https://g.page/r/XXXX/review&name=Mera%20Shop`

## Important notes
- Always include a QR code alongside NFC; some phones do not support NFC.
- Do not offer discounts or gifts in exchange for reviews, and do not ask only customers who are likely to leave positive reviews (Google policy).
- Test the QR code with your phone before printing.
