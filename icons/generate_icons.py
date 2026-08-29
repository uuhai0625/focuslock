from PIL import Image, ImageDraw
import math

SIZE = 512
OUT_DIR = "."

def lerp(a, b, t):
    return a + (b - a) * t

def gradient_color(t, c1, c2):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))

def make_base(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    c1 = (47, 111, 237)   # blue (PromptDiff/SnapFolioと同系統)
    c2 = (122, 79, 209)   # purple
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = gradient_color(t, c1, c2) + (255,)

    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(size * 0.22)
    mdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.paste(img, (0, 0), mask)
    return rounded

def draw_lock(img, size):
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)

    body_w = size * 0.40
    body_h = size * 0.32
    body_x0 = (size - body_w) / 2
    body_y0 = size * 0.50
    body_x1 = body_x0 + body_w
    body_y1 = body_y0 + body_h
    body_radius = size * 0.06
    draw.rounded_rectangle([body_x0, body_y0, body_x1, body_y1], radius=body_radius, fill=white)

    shackle_w = size * 0.26
    shackle_cx = size / 2
    shackle_top = size * 0.26
    shackle_bottom = body_y0 + size * 0.02
    stroke = size * 0.075

    bbox = [
        shackle_cx - shackle_w / 2,
        shackle_top,
        shackle_cx + shackle_w / 2,
        shackle_bottom + shackle_w / 2,
    ]
    draw.arc(bbox, start=180, end=360, fill=white, width=int(stroke))
    draw.rectangle(
        [shackle_cx - shackle_w / 2 - stroke / 2, shackle_top + shackle_w / 4, shackle_cx - shackle_w / 2 + stroke / 2, shackle_bottom],
        fill=white,
    )
    draw.rectangle(
        [shackle_cx + shackle_w / 2 - stroke / 2, shackle_top + shackle_w / 4, shackle_cx + shackle_w / 2 + stroke / 2, shackle_bottom],
        fill=white,
    )

    keyhole_r = size * 0.035
    keyhole_cx = size / 2
    keyhole_cy = body_y0 + body_h * 0.38
    draw.ellipse(
        [keyhole_cx - keyhole_r, keyhole_cy - keyhole_r, keyhole_cx + keyhole_r, keyhole_cy + keyhole_r],
        fill=(47, 111, 237, 255),
    )
    draw.polygon(
        [
            (keyhole_cx - keyhole_r * 0.6, keyhole_cy + keyhole_r * 0.4),
            (keyhole_cx + keyhole_r * 0.6, keyhole_cy + keyhole_r * 0.4),
            (keyhole_cx + keyhole_r * 0.9, keyhole_cy + keyhole_r * 2.2),
            (keyhole_cx - keyhole_r * 0.9, keyhole_cy + keyhole_r * 2.2),
        ],
        fill=(47, 111, 237, 255),
    )

base = make_base(SIZE)
draw_lock(base, SIZE)

for size in (128, 48, 16):
    resized = base.resize((size, size), Image.LANCZOS)
    resized.save(f"{OUT_DIR}/icon{size}.png")

print("done")
