import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const fileArray = Array.isArray(files.files) ? files.files : [files.files];

    for (const file of fileArray) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf', 'text/plain', 'application/zip'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        continue;
      }

      // Generate safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const newFileName = `${path.parse(safeName).name}_${timestamp}${path.extname(safeName)}`;

      // Read file buffer
      const fileBuffer = fs.readFileSync(file.filepath);

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: newFileName,
        Body: fileBuffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Generate private S3 URL (you'll need signed URLs to access)
      const s3Url = `s3://${process.env.AWS_S3_BUCKET}/${newFileName}`;

      uploadedFiles.push({
        original_name: file.originalFilename,
        saved_name: newFileName,
        size: file.size,
        type: file.mimetype,
        s3_key: newFileName,
        message: 'File uploaded privately to S3'
      });
    }

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
}