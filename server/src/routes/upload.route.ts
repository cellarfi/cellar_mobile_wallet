import uploadController, {
  DeleteMultipleUploadsRequest,
  DeleteUploadRequest,
  UploadRequest,
} from '@/controllers/uploadController';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, GIFs, and common document types
    const allowedMimeTypes = [
      'image/',
      'video/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json'
    ];

    const isAllowed = allowedMimeTypes.some(type => 
      file.mimetype.startsWith(type) || 
      file.mimetype === type
    );

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed types: images, videos, GIFs, PDFs, and Office documents'));
    }
  },
});

// Apply authentication middleware to all routes
router.use(authMiddleware());

// Upload a single file
router.post(
  '/single',
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    uploadController.uploadSingleFile(req as UploadRequest, res).catch(next);
  }
);

// Upload multiple files
router.post(
  '/multiple',
  upload.array('files', 5),
  (req: Request, res: Response, next: NextFunction) => {
    uploadController.uploadMultipleFiles(req as UploadRequest, res).catch(next);
  }
);

// Delete a single file
router.delete(
  '/:publicId',
  (req: Request<{ publicId: string }>, res: Response, next: NextFunction) => {
    uploadController.deleteUpload(req as DeleteUploadRequest, res).catch(next);
  }
);

// Delete multiple files
type DeleteMultipleUploadsBody = { publicIds: string[] };
router.delete<{}, {}, DeleteMultipleUploadsBody>(
  '/',
  (
    req: Request<{}, {}, DeleteMultipleUploadsBody>,
    res: Response,
    next: NextFunction
  ) => {
    uploadController
      .deleteMultipleUploads(req as DeleteMultipleUploadsRequest, res)
      .catch(next);
  }
);

export default router;
