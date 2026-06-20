---
name: pixel2motion
description: AI skill that converts static bitmap logos into clean, animatable SVGs and automatically generates smooth logo animations. Exports as dependency-free interactive HTML with GIF/video previews. Use when the user needs to animate a logo, create logo animations, convert raster images to vector animations, or generate motion graphics from static images.
license: MIT
---

# Pixel2Motion

## When to Use This Skill

Apply when the user wants to:
- Convert a static logo (PNG, JPG, etc.) into an animated version
- Create smooth logo animations for branding, websites, or presentations
- Transform raster/bitmap images into clean, animatable SVG
- Generate motion graphics from static images
- Export logo animations as interactive HTML, GIF, or video

**Related skills:** For general SVG animation use **gsap-core**; for complex timeline sequencing use **gsap-timeline**; for scroll-triggered animations use **gsap-scrolltrigger**.

## What Pixel2Motion Does

Pixel2Motion is an AI-powered tool that:

1. **Reconstructs** any bitmap logo into extremely clean, animatable SVG paths
2. **Automatically orchestrates** smooth logo entrance/reveal animations
3. **Exports** as dependency-free interactive HTML, plus GIF or video preview
4. **Preserves** visual fidelity while enabling animation capabilities

## When to Use Pixel2Motion

**Risk level: LOW** — Image processing and animation generation tool.

Use Pixel2Motion when:

- ✅ You have a static logo that needs animation
- ✅ Brand identity requires motion graphics
- ✅ Website/app needs animated logo elements
- ✅ Presentations need dynamic logo reveals
- ✅ Social media content needs animated branding

### Prefer Pixel2Motion Instead of Manual SVG Animation When

Manual SVG animation is useful for custom, complex animations. Prefer Pixel2Motion when you need:

- ✅ Quick logo-to-animation conversion
- ✅ Clean SVG path reconstruction from raster images
- ✅ Automated animation sequencing
- ✅ Multiple export formats (HTML, GIF, video)

## Workflow

### Input
- Static bitmap image (PNG, JPG, BMP, etc.) of a logo
- Optional: animation style preferences (reveal direction, timing, easing)

### Processing
1. AI analyzes the logo structure and visual elements
2. Reconstructs clean SVG paths with proper layering
3. Generates smooth animation sequence
4. Renders preview and exportable formats

### Output
- **Interactive HTML**: Self-contained file with animation, no dependencies
- **GIF preview**: Animated preview for quick sharing
- **Video file**: MP4/WebM for video platforms
- **SVG source**: Clean, editable vector paths

## Best Practices

- ✅ Use high-contrast, clean logo images for best results
- ✅ Simple logos convert more accurately than complex illustrations
- ✅ Provide clear background (white/transparent) for cleaner SVG extraction
- ✅ Review and fine-tune the generated SVG paths if needed
- ✅ Test animation at target display size before final export

## Limitations

- Complex photographic elements may not convert cleanly to SVG
- Very detailed textures may be simplified during vectorization
- Animation style is automated; custom keyframes require manual editing
- Processing time varies with image complexity

## Integration

Pixel2Motion outputs can be integrated into:
- Websites (HTML embed)
- React/Vue/Angular apps (SVG component)
- Video editing software (GIF/video export)
- Presentation software (animated GIF)
- Social media platforms (video/GIF upload)