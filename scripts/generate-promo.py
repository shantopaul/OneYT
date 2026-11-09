#!/usr/bin/env python3
"""OneYT — promo tile generator (Phase 7).

Branded tiles for the Chrome Web Store (no screenshots here —
those must be real, see docs/SCREENSHOTS.md):
  - small tile   440x280   (required for the listing to display)
  - large tile   920x680   (featured spots)
  - marquee     1400x560   (homepage features)

Design: dark bg, the Y mark left, "OneYT" wordmark + tagline
right, one thin red accent bar. Text kept minimal — tiles are
shown at half size in the store. No Chrome/Google branding,
no YouTube logo, no fake UI.

Usage: python3 scripts/generate-promo.py
Writes: assets/promo/{small-tile,large-tile,marquee}.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "assets", "promo")
ICON = os.path.join(HERE, "assets", "icons", "icon512.png")

BG = (15, 15, 15, 255)
WHITE = (241, 241, 241, 255)
GREY = (170, 170, 170, 255)
RED = (255, 0, 51, 255)
BORDER = (42, 42, 42, 255)

FONT_DIR = "/usr/share/fonts/truetype/dejavu"


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def make_tile(width, height, mark_px, word_px, tag_px, tag_lines, name):
    img = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(img)
    # Thin red strip along the bottom edge (the accent).
    d.rectangle([0, height - 6, width, height], fill=RED)
    # Mark, vertically centred, left margin ~8% of width.
    mark = Image.open(ICON).resize((mark_px, mark_px), Image.LANCZOS)
    mx = int(width * 0.08)
    my = (height - mark_px) // 2
    img.paste(mark, (mx, my), mark)
    # Text block to the right of the mark.
    tx = mx + mark_px + int(width * 0.05)
    word = font("DejaVuSans-Bold.ttf", word_px)
    tag = font("DejaVuSans.ttf", tag_px)
    word_y = my + int(mark_px * 0.18)
    d.text((tx, word_y), "OneYT", fill=WHITE, font=word)
    # Red bar under the wordmark.
    bar_y = word_y + word_px + int(word_px * 0.28)
    d.rectangle([tx, bar_y, tx + int(word_px * 1.1), bar_y + max(3, word_px // 14)], fill=RED)
    ty = bar_y + int(word_px * 0.28)
    for line in tag_lines:
        d.text((tx, ty), line, fill=GREY, font=tag)
        ty += int(tag_px * 1.45)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"wrote assets/promo/{name} ({width}x{height})")


def main():
    make_tile(440, 280, 140, 46, 15, ["Your YouTube.", "Your Layout. Your Rules."], "small-tile.png")
    make_tile(920, 680, 300, 104, 30, ["Your YouTube.", "Your Layout. Your Rules."], "large-tile.png")
    make_tile(
        1400,
        560,
        280,
        116,
        32,
        ["Your YouTube. Your Layout. Your Rules."],
        "marquee.png",
    )


if __name__ == "__main__":
    main()
