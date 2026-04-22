#!/bin/bash
# Detect faces and crop all landing photos to 16:9 centered on face

INPUT_DIR="assets/landing"
OUTPUT_DIR="assets/landing/cropped"
TARGET_W=1920
TARGET_H=1080

mkdir -p "$OUTPUT_DIR"

for img in "$INPUT_DIR"/*.jpg "$INPUT_DIR"/*.jpeg "$INPUT_DIR"/*.JPG; do
    [ -f "$img" ] || continue
    fname=$(basename "$img")
    
    # Skip if already in cropped
    [[ "$img" == *"/cropped/"* ]] && continue
    
    # Get dimensions
    W=$(sips -g pixelWidth "$img" 2>/dev/null | grep pixelWidth | awk '{print $2}')
    H=$(sips -g pixelHeight "$img" 2>/dev/null | grep pixelHeight | awk '{print $2}')
    
    [ -z "$W" ] || [ -z "$H" ] && echo "  ✗ $fname — skip" && continue
    
    echo "  $fname (${W}x${H})"
    
    # Detect face
    RESULT=$(swift scripts/face-detect.swift "$img" 2>/dev/null)
    
    if [[ "$RESULT" == FACE:* ]]; then
        COORDS="${RESULT#FACE:}"
        CX=$(echo "$COORDS" | cut -d',' -f1)
        CY=$(echo "$COORDS" | cut -d',' -f2)
        echo "    → face at ($CX, $CY)"
        
        # Calculate 16:9 crop
        CROP_W=$W
        CROP_H=$(echo "$CROP_W * 9 / 16" | bc)
        
        if [ "$CROP_H" -gt "$H" ]; then
            CROP_H=$H
            CROP_W=$(echo "$CROP_H * 16 / 9" | bc)
        fi
        
        # Center on face
        FACE_X=$(echo "$CX * $W" | bc | cut -d'.' -f1)
        FACE_Y=$(echo "$CY * $H" | bc | cut -d'.' -f1)
        
        X=$((FACE_X - CROP_W / 2))
        Y=$((FACE_Y - CROP_H / 2))
        
        # Clamp
        [ "$X" -lt 0 ] && X=0
        [ "$Y" -lt 0 ] && Y=0
        [ $((X + CROP_W)) -gt "$W" ] && X=$((W - CROP_W))
        [ $((Y + CROP_H)) -gt "$H" ] && Y=$((H - CROP_H))
        
        echo "    → crop: ${CROP_W}x${CROP_H} at ($X, $Y)"
        
        cp "$img" "$OUTPUT_DIR/$fname"
        sips --cropOffset "$Y" "$X" --cropToHeightWidth "$CROP_H" "$CROP_W" "$OUTPUT_DIR/$fname" --out "$OUTPUT_DIR/$fname" > /dev/null 2>&1
        sips --resampleWidth $TARGET_W --resampleHeight $TARGET_H "$OUTPUT_DIR/$fname" --out "$OUTPUT_DIR/$fname" > /dev/null 2>&1
    else
        echo "    → no face — upper-center crop"
        
        CROP_W=$W
        CROP_H=$(echo "$CROP_W * 9 / 16" | bc)
        
        if [ "$CROP_H" -gt "$H" ]; then
            CROP_H=$H
            CROP_W=$(echo "$CROP_H * 16 / 9" | bc)
        fi
        
        X=$(( (W - CROP_W) / 2 ))
        Y=$(echo "$H * 15 / 100" | bc)
        [ $((Y + CROP_H)) -gt "$H" ] && Y=$((H - CROP_H))
        [ "$Y" -lt 0 ] && Y=0
        
        cp "$img" "$OUTPUT_DIR/$fname"
        sips --cropOffset "$Y" "$X" --cropToHeightWidth "$CROP_H" "$CROP_W" "$OUTPUT_DIR/$fname" --out "$OUTPUT_DIR/$fname" > /dev/null 2>&1
        sips --resampleWidth $TARGET_W --resampleHeight $TARGET_H "$OUTPUT_DIR/$fname" --out "$OUTPUT_DIR/$fname" > /dev/null 2>&1
    fi
done

echo ""
echo "✓ Done! Cropped images in $OUTPUT_DIR/"
