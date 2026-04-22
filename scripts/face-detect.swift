import Vision
import AppKit
import Foundation

// Detect face center in an image, print as "cx,cy" (fractions 0-1)
// Usage: swift face-detect.swift <image_path>

guard CommandLine.arguments.count > 1 else {
    print("NO_ARG")
    exit(1)
}

let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)

guard let image = NSImage(contentsOf: url),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("NO_IMAGE")
    exit(1)
}

let request = VNDetectFaceRectanglesRequest()
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
} catch {
    print("ERROR")
    exit(1)
}

guard let results = request.results, !results.isEmpty else {
    print("NO_FACE")
    exit(0)
}

// Find the largest face
var bestFace = results[0]
for face in results {
    if face.boundingBox.width * face.boundingBox.height > bestFace.boundingBox.width * bestFace.boundingBox.height {
        bestFace = face
    }
}

// Vision coordinates: origin bottom-left, normalized 0-1
let box = bestFace.boundingBox
let cx = box.origin.x + box.size.width / 2
// Flip Y to top-left origin
let cy = 1.0 - (box.origin.y + box.size.height / 2)

print(String(format: "FACE:%.4f,%.4f", cx, cy))
