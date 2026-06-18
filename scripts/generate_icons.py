#!/usr/bin/env python3
"""
生成TongXiao APP图标
使用方法：python generate_icons.py [icon_size]
默认生成所有尺寸的图标
"""

import os
import sys
from pathlib import Path

def create_icon(size):
    """创建指定尺寸的图标"""
    try:
        from PIL import Image, ImageDraw
        
        # 创建新图像
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 绘制背景圆形
        padding = size * 0.05
        circle_bbox = [padding, padding, size - padding, size - padding]
        draw.ellipse(circle_bbox, fill='#4A90D9')
        
        # 绘制书本图标
        book_left = size * 0.25
        book_right = size * 0.75
        book_top = size * 0.3
        book_bottom = size * 0.7
        
        # 书本背景
        draw.rectangle([book_left, book_top, book_right, book_bottom], fill='white')
        
        # 书本中线
        mid_x = size * 0.5
        draw.line([(mid_x, book_top), (mid_x, book_bottom)], fill='#4A90D9', width=max(1, size//30))
        
        # 书页效果
        page_left = book_left + size * 0.02
        page_right = mid_x - size * 0.02
        draw.rectangle([page_left, book_top + size * 0.02, page_right, book_bottom - size * 0.02], fill='#E8F4FD')
        
        page_left2 = mid_x + size * 0.02
        page_right2 = book_right - size * 0.02
        draw.rectangle([page_left2, book_top + size * 0.02, page_right2, book_bottom - size * 0.02], fill='#E8F4FD')
        
        return img
        
    except ImportError:
        print("错误：需要安装Pillow库")
        print("请运行：pip install Pillow")
        sys.exit(1)

def main():
    """主函数"""
    # 定义图标尺寸
    android_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    ios_sizes = {
        'icon-20': 20,
        'icon-29': 29,
        'icon-40': 40,
        'icon-60': 60,
        'icon-76': 76,
        'icon-83.5': 84,
        'icon-1024': 1024
    }
    
    # 创建输出目录
    base_dir = Path(__file__).parent.parent / 'frontend'
    android_dir = base_dir / 'android' / 'app' / 'src' / 'main' / 'res'
    ios_dir = base_dir / 'ios' / 'App' / 'App' / 'Assets.xcassets' / 'AppIcon.appiconset'
    
    # 确保目录存在
    android_dir.mkdir(parents=True, exist_ok=True)
    ios_dir.mkdir(parents=True, exist_ok=True)
    
    print("正在生成TongXiao APP图标...")
    
    # 生成Android图标
    print("\n=== Android 图标 ===")
    for folder, size in android_sizes.items():
        output_dir = android_dir / folder
        output_dir.mkdir(exist_ok=True)
        
        img = create_icon(size)
        output_path = output_dir / 'ic_launcher.png'
        img.save(output_path, 'PNG')
        print(f"✓ {folder}/ic_launcher.png ({size}x{size})")
    
    # 生成iOS图标
    print("\n=== iOS 图标 ===")
    for name, size in ios_sizes.items():
        img = create_icon(size)
        output_path = ios_dir / f'{name}.png'
        img.save(output_path, 'PNG')
        print(f"✓ {name}.png ({size}x{size})")
    
    # 生成应用图标（1024x1024）
    print("\n=== 应用图标 ===")
    app_icon = create_icon(1024)
    app_icon_path = base_dir / 'assets' / 'app-icon-1024.png'
    app_icon_path.parent.mkdir(exist_ok=True)
    app_icon.save(app_icon_path, 'PNG')
    print(f"✓ assets/app-icon-1024.png (1024x1024)")
    
    print("\n✅ 图标生成完成！")
    print(f"Android图标目录: {android_dir}")
    print(f"iOS图标目录: {ios_dir}")

if __name__ == '__main__':
    main()