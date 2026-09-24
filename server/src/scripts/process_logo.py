import os
import math
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

src_path = r"C:\Users\Administrator\.gemini\antigravity-ide\brain\502a9515-742b-4ed6-a967-9fb906e00033\.user_uploaded\media_1790250446247.png"
out_dir = r"c:\Users\Administrator\Desktop\buildForce360\client\public"

im = Image.open(src_path).convert("RGBA")
width, height = im.size
pixels = im.load()

# Background color is approximately (252, 251, 246)
bg_r, bg_g, bg_b = 252, 251, 246

new_im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
new_pixels = new_im.load()

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Color distance from background
        dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
        if dist < 18:
            new_pixels[x, y] = (0, 0, 0, 0)
        elif dist < 38:
            # Feather edge
            alpha_frac = (dist - 18) / 20.0
            new_pixels[x, y] = (r, g, b, int(alpha_frac * 255))
        elif r > 242 and g > 240 and b > 235:
            new_pixels[x, y] = (0, 0, 0, 0)
        else:
            new_pixels[x, y] = (r, g, b, a)

bbox = new_im.getbbox()
cropped = new_im.crop(bbox)

pad = 40
padded = Image.new("RGBA", (cropped.width + pad * 2, cropped.height + pad * 2), (0, 0, 0, 0))
padded.paste(cropped, (pad, pad), cropped)

os.makedirs(out_dir, exist_ok=True)
logo_path = os.path.join(out_dir, "logo.png")
padded.save(logo_path, "PNG")

logo_light_path = os.path.join(out_dir, "logo-light.png")
padded.save(logo_light_path, "PNG")

# Dark Mode Logo:
# In dark mode, we create a gorgeous version with an electric-cyan aura/glow and refined contrast
alpha_mask = padded.split()[3]
blurred_glow = alpha_mask.filter(ImageFilter.GaussianBlur(radius=10))

glow_img = Image.new("RGBA", padded.size, (14, 165, 233, 0))
glow_pixels = glow_img.load()
blurred_pixels = blurred_glow.load()

for y in range(padded.height):
    for x in range(padded.width):
        a_val = blurred_pixels[x, y]
        if a_val > 0:
            glow_pixels[x, y] = (14, 165, 233, int(a_val * 0.45))

# Stroke
expanded_mask = alpha_mask.filter(ImageFilter.MaxFilter(size=5))
stroke_img = Image.new("RGBA", padded.size, (56, 189, 248, 0))
stroke_pixels = stroke_img.load()
exp_pixels = expanded_mask.load()
orig_alpha_pixels = alpha_mask.load()

for y in range(padded.height):
    for x in range(padded.width):
        diff = exp_pixels[x, y] - orig_alpha_pixels[x, y]
        if diff > 0:
            stroke_pixels[x, y] = (56, 189, 248, int(diff * 0.55))

dark_composite = Image.alpha_composite(glow_img, stroke_img)
dark_logo = Image.alpha_composite(dark_composite, padded)

dark_logo_path = os.path.join(out_dir, "logo-dark.png")
dark_logo.save(dark_logo_path, "PNG")

# Also copy into client/src/assets
assets_dir = r"c:\Users\Administrator\Desktop\buildForce360\client\src\assets"
os.makedirs(assets_dir, exist_ok=True)
padded.save(os.path.join(assets_dir, "logo.png"), "PNG")
padded.save(os.path.join(assets_dir, "logo-light.png"), "PNG")
dark_logo.save(os.path.join(assets_dir, "logo-dark.png"), "PNG")

# Favicon
fav_icon = padded.resize((64, 64), Image.Resampling.LANCZOS)
fav_icon.save(os.path.join(out_dir, "favicon.png"), "PNG")

print("Generated all logo variants successfully!")
