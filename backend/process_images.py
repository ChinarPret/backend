#!/usr/bin/env python3
"""
Chinar Collection - Image Auto-Processor
------------------------------------------------
Drop any new photo(s) into  backend/raw_uploads/<product-folder>/
and run:   python3 process_images.py

Every image gets automatically:
  1. Oriented correctly (reads EXIF rotation from phone/WhatsApp photos)
  2. Cropped/centered to a clean 3:4 product-card ratio
  3. Exported in two sizes (full + thumb) as optimized JPEGs
  4. Named in order so the storefront gallery ("clips") shows them correctly

No manual resizing ever needed again.
"""
import os
import json
from PIL import Image, ImageOps

RAW_DIR = "raw_uploads"
OUT_DIR = os.path.join("..", "assets", "images", "products")
FULL_SIZE = (900, 1200)   # 3:4 product / gallery image
THUMB_SIZE = (360, 480)   # grid card thumbnail
QUALITY = 86


def smart_crop_resize(im: Image.Image, target_size):
    """Cover-fit crop centered, like CSS object-fit: cover, then resize."""
    im = ImageOps.exif_transpose(im)  # fix phone camera rotation
    im = im.convert("RGB")
    tw, th = target_size
    target_ratio = tw / th
    w, h = im.size
    src_ratio = w / h
    if src_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = max(0, int((h - new_h) * 0.35))
        im = im.crop((0, top, w, top + new_h))
    return im.resize(target_size, Image.LANCZOS)


def process_folder():
    if not os.path.isdir(RAW_DIR):
        print(f"No '{RAW_DIR}' folder found. Create it and add product subfolders.")
        return

    manifest = {}
    for product_slug in sorted(os.listdir(RAW_DIR)):
        product_path = os.path.join(RAW_DIR, product_slug)
        if not os.path.isdir(product_path):
            continue
        files = sorted(
            f for f in os.listdir(product_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        )
        out_product_dir = os.path.join(OUT_DIR, product_slug)
        os.makedirs(out_product_dir, exist_ok=True)

        clips = []
        for i, fname in enumerate(files, start=1):
            src = os.path.join(product_path, fname)
            im = Image.open(src)

            full = smart_crop_resize(im, FULL_SIZE)
            thumb = smart_crop_resize(im, THUMB_SIZE)

            full_name = f"clip-{i}.jpg"
            thumb_name = f"clip-{i}-thumb.jpg"
            full.save(os.path.join(out_product_dir, full_name), "JPEG", quality=QUALITY, optimize=True)
            thumb.save(os.path.join(out_product_dir, thumb_name), "JPEG", quality=QUALITY, optimize=True)
            clips.append(f"assets/images/products/{product_slug}/{full_name}")

        manifest[product_slug] = clips
        print(f"Processed {product_slug}: {len(clips)} clip(s)")

    with open("image_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print("\nDone. See image_manifest.json - merge new slugs into products.json.")


if __name__ == "__main__":
    process_folder()
