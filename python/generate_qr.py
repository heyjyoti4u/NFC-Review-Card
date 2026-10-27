"""Google review link se QR code (PNG + SVG) banata hai.

Chalane ka tareeka:
    pip install -r requirements.txt
    python generate_qr.py "https://g.page/r/XXXXXXX/review"
    python generate_qr.py "https://g.page/r/XXXXXXX/review" --out my-shop --color "#0f766e"
"""
import argparse
import re
import sys

import qrcode
import qrcode.image.svg
from qrcode.constants import ERROR_CORRECT_M


def clean_url(raw: str) -> str:
    url = raw.strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    if not re.match(r"^https?://[^\s/]+\.[^\s/]+", url, re.I):
        sys.exit("Link galat lag rahi hai. Poori link do, jaise https://g.page/r/XXXX/review")
    return url


def main() -> None:
    p = argparse.ArgumentParser(description="Review link ka QR code banao")
    p.add_argument("link", help="Google review link")
    p.add_argument("--out", default="review-qr", help="output file ka naam (bina extension)")
    p.add_argument("--color", default="black", help="QR ka rang, jaise '#0f766e' (dark rakho, scan ke liye)")
    args = p.parse_args()

    url = clean_url(args.link)

    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=24, border=4)
    qr.add_data(url)
    qr.make(fit=True)

    png = qr.make_image(fill_color=args.color, back_color="white")
    png.save(f"{args.out}.png")

    svg_qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=4, image_factory=qrcode.image.svg.SvgPathImage)
    svg_qr.add_data(url)
    svg_qr.make(fit=True)
    svg_qr.make_image().save(f"{args.out}.svg")

    print(f"Ban gaya: {args.out}.png aur {args.out}.svg")
    print(f"QR me ye link hai: {url}")
    print("Print karne se pehle phone se scan karke ek baar test zaroor karo.")


if __name__ == "__main__":
    main()
