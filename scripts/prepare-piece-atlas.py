"""Split the illustrated chroma-key atlas into game-ready ivory and obsidian sprites."""
from pathlib import Path
import sys

import numpy as np
from PIL import Image

OUT = Path("public/themes/golden-library")
ORDER = "PRNBQK"
SIZE = 256


def isolate(tile):
    rgb = np.asarray(tile.convert("RGB"), dtype=np.float32)
    red, green, blue = rgb.transpose(2, 0, 1)
    excess = green - np.maximum(red, blue)
    alpha = np.clip((95 - excess) / 73, 0, 1)
    alpha[(green < 13) | (excess < 13)] = 1
    alpha[alpha < .09] = 0
    rgb[..., 1] = np.where(excess > 14, np.minimum(green, np.maximum(red, blue) + 8), green)
    rgba = Image.fromarray(np.uint8(np.dstack((rgb, 255 * alpha))), "RGBA")
    bounds = rgba.getbbox()
    if not bounds or bounds[0] < 2 or bounds[2] > tile.width - 2:
        raise ValueError("A sprite touches another tile or the atlas has no clear margins.")
    return rgba.crop(bounds)


def obsidian(piece):
    rgba = np.array(piece)
    rgb = rgba[..., :3].astype(float)
    red, green, blue = rgb.transpose(2, 0, 1)
    gold = np.clip(((red - blue) / (red + 1) - .23) / .27, 0, 1)
    gold *= np.clip((red - green - 12) / 38, 0, 1)
    luma = (red * .24 + green * .65 + blue * .11) / 255
    gloss = 12 + 87 * luma ** 3.6 + 38 * luma ** 18
    stone = np.dstack((gloss * .90, gloss * .93, gloss))
    rgba[..., :3] = np.uint8(np.clip(stone * (1 - gold[..., None]) + rgb * gold[..., None], 0, 255))
    return Image.fromarray(rgba, "RGBA")


def frame(piece, kind):
    target = dict(P=151, R=167, N=193, B=195, Q=216, K=227)[kind]
    factor = min(target / piece.height, 174 / piece.width)
    piece = piece.resize((round(piece.width * factor), round(piece.height * factor)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE))
    canvas.alpha_composite(piece, ((SIZE - piece.width) // 2, 235 - piece.height))
    return canvas


def main():
    atlas = Image.open(sys.argv[1])
    width, height = atlas.size
    # The taller pieces in the second row start above the image midpoint.
    edges = (0, round(height * 435 / 1024), height)
    prepared = []
    for index, kind in enumerate(ORDER):
        row, col = divmod(index, 3)
        tile = atlas.crop((round(col * width / 3), edges[row],
                           round((col + 1) * width / 3), edges[row + 1]))
        prepared.append((kind, frame(isolate(tile), kind)))
    for kind, light in prepared:
        light.save(OUT / ("w" + kind + ".webp"), quality=95, method=6)
        obsidian(light).save(OUT / ("b" + kind + ".webp"), quality=95, method=6)


if __name__ == "__main__":
    main()
