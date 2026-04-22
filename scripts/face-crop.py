#!/usr/bin/env python3
"""
Face-detect and crop images to 16:9 centered on the face.
Uses macOS Vision framework via objc bridge.
Falls back to CoreImage if Vision isn't available.
"""

import os
import sys
import subprocess
import json

INPUT_DIR = "assets/landing"
OUTPUT_DIR = "assets/landing/cropped"
TARGET_RATIO = 16 / 9  # landscape for hero background
OUTPUT_WIDTH = 1920
OUTPUT_HEIGHT = 1080

def get_image_size(path):
    """Get image dimensions using sips."""
    result = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
        capture_output=True, text=True
    )
    w = h = 0
    for line in result.stdout.split("\n"):
        if "pixelWidth" in line:
            w = int(line.split(":")[-1].strip())
        if "pixelHeight" in line:
            h = int(line.split(":")[-1].strip())
    return w, h

def detect_face_center(path):
    """
    Use macOS CoreImage CIDetector for face detection.
    Returns (center_x, center_y) as fractions (0-1) of image dimensions,
    or None if no face found.
    """
    script = f'''
import Quartz
from Quartz import CIImage, CIDetector, CIContext
import CoreFoundation

url = CoreFoundation.CFURLCreateWithFileSystemPath(
    None, "{path}", 0, False
)
ci_image = CIImage.imageWithContentsOfURL_(url)
if ci_image is None:
    print("NO_IMAGE")
    exit()

context = CIContext.contextWithOptions_(None)
detector = CIDetector.detectorOfType_context_options_(
    "CIDetectorTypeFace", context,
    {{"CIDetectorAccuracy": "CIDetectorAccuracyHigh"}}
)

features = detector.featuresInImage_(ci_image)
if not features or len(features) == 0:
    print("NO_FACE")
    exit()

# Get the largest face (most prominent)
best = None
best_area = 0
for f in features:
    bounds = f.bounds()
    area = bounds.size.width * bounds.size.height
    if area > best_area:
        best_area = area
        best = bounds

# CIImage coordinates are bottom-left origin
extent = ci_image.extent()
img_w = extent.size.width
img_h = extent.size.height

cx = (best.origin.x + best.size.width / 2) / img_w
# Flip Y since CI is bottom-left origin
cy = 1.0 - (best.origin.y + best.size.height / 2) / img_h

print(f"FACE:{{cx:.4f}},{{cy:.4f}}")
'''
    result = subprocess.run(
        ["python3", "-c", script],
        capture_output=True, text=True
    )

    output = result.stdout.strip()
    if output.startswith("FACE:"):
        parts = output.replace("FACE:", "").split(",")
        return float(parts[0]), float(parts[1])
    
    # Print debug info
    if result.stderr:
        print(f"  Debug: {result.stderr.strip()[:100]}")
    
    return None

def crop_image(path, output_path, face_center, img_w, img_h):
    """Crop to 16:9 centered on face, then resize using sips."""
    cx_frac, cy_frac = face_center
    
    # Calculate crop dimensions at 16:9
    # Try to make the crop as large as possible
    crop_w = img_w
    crop_h = int(crop_w / TARGET_RATIO)
    
    if crop_h > img_h:
        crop_h = img_h
        crop_w = int(crop_h * TARGET_RATIO)
    
    # Center crop on face
    cx_px = int(cx_frac * img_w)
    cy_px = int(cy_frac * img_h)
    
    # Calculate crop origin (top-left)
    x = cx_px - crop_w // 2
    y = cy_px - crop_h // 2
    
    # Clamp to image bounds
    x = max(0, min(x, img_w - crop_w))
    y = max(0, min(y, img_h - crop_h))
    
    # sips crop uses --cropOffset Y X and --cropToHeightWidth H W
    subprocess.run([
        "sips",
        "--cropOffset", str(y), str(x),
        "--cropToHeightWidth", str(crop_h), str(crop_w),
        "--resampleWidth", str(OUTPUT_WIDTH),
        "--resampleHeight", str(OUTPUT_HEIGHT),
        path,
        "--out", output_path
    ], capture_output=True)

def crop_center_fallback(path, output_path, img_w, img_h):
    """Fallback: crop to 16:9 from upper-center (assumes face is in top third)."""
    crop_w = img_w
    crop_h = int(crop_w / TARGET_RATIO)
    
    if crop_h > img_h:
        crop_h = img_h
        crop_w = int(crop_h * TARGET_RATIO)
    
    # Position crop in upper third
    x = (img_w - crop_w) // 2
    y = int(img_h * 0.15)  # start 15% from top
    y = max(0, min(y, img_h - crop_h))
    
    subprocess.run([
        "sips",
        "--cropOffset", str(y), str(x),
        "--cropToHeightWidth", str(crop_h), str(crop_w),
        "--resampleWidth", str(OUTPUT_WIDTH),
        "--resampleHeight", str(OUTPUT_HEIGHT),
        path,
        "--out", output_path
    ], capture_output=True)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    files = [f for f in os.listdir(INPUT_DIR) 
             if f.lower().endswith(('.jpg', '.jpeg', '.png'))
             and not f.startswith('.')]
    
    print(f"Processing {len(files)} images...\n")
    
    for fname in sorted(files):
        path = os.path.join(INPUT_DIR, fname)
        output_path = os.path.join(OUTPUT_DIR, fname)
        
        img_w, img_h = get_image_size(path)
        if img_w == 0 or img_h == 0:
            print(f"  ✗ {fname} — couldn't read dimensions, skipping")
            continue
        
        print(f"  {fname} ({img_w}x{img_h})")
        
        face = detect_face_center(os.path.abspath(path))
        
        if face:
            cx, cy = face
            print(f"    → face at ({cx:.0%}, {cy:.0%}) — cropping to 16:9")
            crop_image(path, output_path, face, img_w, img_h)
        else:
            print(f"    → no face detected — using upper-center fallback")
            crop_center_fallback(path, output_path, img_w, img_h)
    
    print(f"\n✓ Done! Cropped images saved to {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()
