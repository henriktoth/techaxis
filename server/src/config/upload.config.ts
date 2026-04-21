import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer configuration for handling thumbnail uploads. 
 * Files are stored on disk with unique names, and only certain image types are allowed. 
 * Also includes a helper function to delete thumbnail files from disk when needed.
 */
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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Multer middleware for handling thumbnail uploads. 
 * Validates file type and size, and stores files on disk with unique names.
 */
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
 * Delete a thumbnail file from disk via its URL path.
 * @param thumbnailUrl url of the thumbnail
 */
export const deleteThumbnailFile = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return;

    const filename = path.basename(thumbnailUrl);
    const filePath = path.join(uploadDir, filename);
    
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) return;

    if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
    }
};
