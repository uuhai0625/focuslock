from PIL import Image, ImageDraw, ImageFilter
import os

W, H = 1280, 800
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def lerp(a, b, t):
    return a + (b - a) * t

def gradient_color(t, c1, c2):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))

def make_gradient_bg(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    c1 = (47, 111, 237)
    c2 = (122, 79, 209)
    for y in range(h):
        for x in range(w):
            t = (x + y) / (w + h)
            px[x, y] = gradient_color(t, c1, c2)
    return img

def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask

def add_shadow(base, box, radius=24, blur=30, opacity=90):
    x0, y0, x1, y1 = box
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([x0, y0 + 12, x1, y1 + 12], radius=radius, fill=(0, 0, 0, opacity))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(shadow)

def compose_card(screenshot_path, out_name, max_h_ratio=0.82):
    shot = Image.open(screenshot_path).convert("RGB")
    bg = make_gradient_bg(W, H).convert("RGBA")

    max_h = int(H * max_h_ratio)
    max_w = int(W * 0.62)
    scale = min(max_h / shot.height, max_w / shot.width, 1.6)
    new_w, new_h = int(shot.width * scale), int(shot.height * scale)
    shot = shot.resize((new_w, new_h), Image.LANCZOS)

    pad = 0
    card_w, card_h = new_w + pad * 2, new_h + pad * 2
    x0 = (W - card_w) // 2
    y0 = (H - card_h) // 2

    add_shadow(bg, (x0, y0, x0 + card_w, y0 + card_h))

    card = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
    card.paste(shot, (pad, pad))
    mask = rounded_mask((card_w, card_h), 16)
    bg.paste(card, (x0, y0), mask)

    bg.convert("RGB").save(os.path.join(OUT_DIR, out_name), quality=95)
    print(f"{out_name}: {W}x{H}")

def compose_full(screenshot_path, out_name):
    shot = Image.open(screenshot_path).convert("RGB")
    target_ratio = W / H
    src_ratio = shot.width / shot.height
    if src_ratio > target_ratio:
        new_w = int(shot.height * target_ratio)
        x0 = (shot.width - new_w) // 2
        shot = shot.crop((x0, 0, x0 + new_w, shot.height))
    else:
        new_h = int(shot.width / target_ratio)
        y0 = (shot.height - new_h) // 2
        shot = shot.crop((0, y0, shot.width, y0 + new_h))
    shot = shot.resize((W, H), Image.LANCZOS)
    shot.save(os.path.join(OUT_DIR, out_name), quality=95)
    print(f"{out_name}: {W}x{H}")

compose_card("03_popup_idle_free_upgrade.png", "store_01_popup_free.png")
compose_card("04_popup_phrase_error.png", "store_02_popup_phrase_error.png")
compose_card("05_options_schedule.png", "store_03_options_schedule.png")
compose_full("06_blocked_page.png", "store_04_blocked_page.png")

print("done")
