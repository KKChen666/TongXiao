#!/usr/bin/env python3
"""Generate simple icons for TongXiao app"""
import os
from PIL import Image, ImageDraw

def create_icon(size):
    """Create a simple icon with the letter 'T' for TongXiao"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    padding = size * 0.05
    circle_bbox = [padding, padding, size - padding, size - padding]
    draw.ellipse(circle_bbox, fill='#4A90D9')
    
    # Letter 'T'
    font_size = int(size * 0.5)
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Center the letter
    text = "T"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) / 2
    y = (size - text_height) / 2 - size * 0.05
    draw.text((x, y), text, fill='white', font=font)
    
    return img

# Create directories
base_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(base_dir, 'frontend')
public_dir = os.path.join(frontend_dir, 'public')
os.makedirs(public_dir, exist_ok=True)

# Generate icons
sizes = [192, 512]
for size in sizes:
    img = create_icon(size)
    output_path = os.path.join(public_dir, f'icon-{size}.png')
    img.save(output_path, 'PNG')
    print(f"Generated {output_path}")

print("Done!")