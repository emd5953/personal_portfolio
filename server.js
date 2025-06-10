const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create dev-assets directory if it doesn't exist
const uploadDir = './assets';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate safe filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const name = `${path.parse(safeName).name}_${timestamp}${path.extname(safeName)}`;
        cb(null, name);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf',
        'text/plain',
        'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Serve static files (your HTML/CSS)
app.use(express.static('.'));

// Serve uploaded assets
app.use('/dev-assets', express.static(uploadDir));

// Upload endpoint
app.post('/upload', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            original_name: file.originalname,
            saved_name: file.filename,
            path: `/dev-assets/${file.filename}`,
            size: file.size,
            type: file.mimetype
        }));

        res.json({
            success: true,
            uploaded: uploadedFiles,
            errors: [],
            message: `${uploadedFiles.length} file(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed: ' + error.message
        });
    }
});

// Handle multer errors
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large (max 10MB)'
            });
        }
    }
    
    res.status(400).json({
        success: false,
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Upload server running at http://localhost:${PORT}`);
    console.log(`Files will be saved to: ${path.resolve(uploadDir)}`);
    console.log(`Access upload form at: http://localhost:${PORT}/uploadPage.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});