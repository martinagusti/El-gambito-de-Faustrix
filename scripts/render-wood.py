"""Create square-sized maple and walnut parquet textures. Requires NumPy and Pillow."""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path("public/themes/golden-library")
SIZE = 384
rng = np.random.default_rng(54)
y, x = np.mgrid[0:SIZE, 0:SIZE] / SIZE


def texture(name, base, contrast):
    values = np.zeros((SIZE, SIZE))
    for i in range(4):
        for j in range(4):
            mask = (x >= i / 4) & (x < (i + 1) / 4) & (y >= j / 4) & (y < (j + 1) / 4)
            sign = (-1) ** (i + j)
            u, v = x + sign * y, y - sign * x
            wave = u + .045 * np.sin(6 * v + rng.random() * 6) + .009 * np.sin(17 * v + 2 * u)
            rings = np.sin(52 * wave + .6 * np.sin(14 * v)) + .22 * np.sin(255 * wave)
            fine = np.maximum(0, np.sin(215 * wave + 11 * v)) ** 12
            tone = rng.normal(0, 2.1)
            values[mask] = (3 * rings - 2.6 * fine + tone + 3 * np.sin(14 * u + j))[mask]
    light = 9 * (1 - y) + 5 * (1 - x)
    pores = rng.normal(0, 1.45, x.shape)
    rgb = np.array(base) + ((values + pores + light) * contrast)[..., None] * [1, .84, .66]
    Image.fromarray(np.uint8(np.clip(rgb, 0, 255)), 'RGB').save(OUT / (name + '.webp'), quality=91)


texture('maple', (207, 151, 99), 1.6)
texture('walnut', (72, 32, 23), 1.45)
