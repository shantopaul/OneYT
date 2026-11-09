#!/usr/bin/env python3
"""OneYT — final icon generator (Phase 7).

Draws the original OneYT mark and renders it at 16/48/128 px
(manifest) plus a 512 px master used by the promo tiles.

The mark (decided in Phase 7, see Design.md §1):
  - dark rounded square (#0F0F0F, 1 px #2A2A2A border)
  - a bold white geometric "Y" (the Y in OneYT)
  - a small red dot below the stem (the brand accent, used
    sparingly — red is an accent, not the logo itself)

Deliberately NOT a play button: Design.md forbids using
YouTube's logo / play button / red as the logo itself, and the
Phase 1 placeholder was exactly that (a red play triangle).
The Y is drawn from lines + circles, no font, no copied art.

Usage: python3 scripts/generate-icons.py
Writes: assets/icons/icon{16,48,128,512}.png
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "assets", "icons")

BG = (15, 15, 15, 255)
BORDER = (42, 42, 42, 255)
WHITE = (241, 241, 241, 255)
RED = (255, 0, 51, 255)
MASTER = 512


def draw_mark(size):
    """Draw the mark at the given canvas size; returns an RGBA image."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / MASTER  # scale factor from the 512 master geometry

    # Rounded-square background.
    radius = int(112 * s)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    border_w = max(1, int(2 * s))
    d.rounded_rectangle(
        [border_w // 2, border_w // 2, size - 1 - border_w // 2, size - 1 - border_w // 2],
        radius=radius,
        outline=BORDER,
        width=border_w,
    )

    # The "Y": two arms meeting at the centre, one stem down.
    stroke = int(66 * s)
    left = (int(112 * s), int(102 * s))
    right = (int(400 * s), int(102 * s))
    centre = (int(256 * s), int(266 * s))
    stem_end = (int(256 * s), int(410 * s))
    for a, b in ((left, centre), (right, centre), (centre, stem_end)):
        d.line([a, b], fill=WHITE, width=stroke)
    # Round the joints and ends (line caps are square in PIL).
    r = stroke // 2
    for cx, cy in (left, right, centre, stem_end):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)

    # Red dot below the stem (30 at master scale so it survives
    # the 16 px downsample as a visible 2 px accent).
    dot_r = max(1, int(30 * s))
    dot_c = (int(256 * s), int(448 * s))
    d.ellipse(
        [dot_c[0] - dot_r, dot_c[1] - dot_r, dot_c[0] + dot_r, dot_c[1] + dot_r],
        fill=RED,
    )
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    master = draw_mark(MASTER)
    master.save(os.path.join(OUT, "icon512.png"))
    for px in (128, 48, 16):
        master.resize((px, px), Image.LANCZOS).save(os.path.join(OUT, f"icon{px}.png"))
        print(f"wrote assets/icons/icon{px}.png")
    print("wrote assets/icons/icon512.png")


if __name__ == "__main__":
    main()
