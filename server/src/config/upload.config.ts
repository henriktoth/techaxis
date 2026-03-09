import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadThumbnail = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
        }
    },
});

/**
 * Delete a thumbnail file from disk given its URL path.
 * @param thumbnailUrl e.g. "/uploads/thumbnails/abc123.jpg"
 */
export const deleteThumbnailFile = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return;

    const filename = path.basename(thumbnailUrl);
    const filePath = path.join(uploadDir, filename);
    
    // Ensure the resolved path is within the upload directory
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) return;

    if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
    }
};
