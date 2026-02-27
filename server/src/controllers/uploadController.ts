import {
  deleteFile,
  deleteFiles,
  uploadFromBuffer,
  UploadOptions,
} from '@/utils/cloudinary';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extended request type for uploads
export type UploadRequest = Request & {
  file?: Express.Multer.File;
  files?:
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[];
};

// Type for delete request with publicId param
export type DeleteUploadRequest = Request<{ publicId: string }>;

// Type for delete multiple uploads request
export type DeleteMultipleUploadsRequest = Request<
  {},
  {},
  { publicIds: string[] }
>;

/**
 * Single file upload
 */
export const uploadSingleFile = async (
  req: UploadRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const { buffer, originalname, mimetype } = req.file;
    const fileExtension = originalname.split('.').pop() || '';
    const publicId = `${uuidv4()}.${fileExtension}`;

    // Determine resource type based on MIME type
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    
    if (mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else {
      // For documents and other files
      resourceType = 'raw';
    }

    // Set upload options with appropriate folder structure
    const options: UploadOptions = {
      folder: `cellar/${resourceType}s`, // Creates folders like 'cellar/images', 'cellar/videos', 'cellar/raw'
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
      // For raw files, we want to keep the original format
      ...(resourceType === 'raw' && { resource_type: 'raw' }),
    };

    // Upload to Cloudinary
    const result = await uploadFromBuffer(buffer, options);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('[uploadSingleFile] Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while uploading the file',
    });
  }
};

/**
 * Multiple files upload
 */
export const uploadMultipleFiles = async (
  req: UploadRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
      return;
    }

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
    const uploadPromises = files.map(async (file) => {
      const { buffer, originalname, mimetype } = file;
      const fileExtension = originalname.split('.').pop() || '';
      const publicId = `${uuidv4()}.${fileExtension}`;

      // Determine resource type based on MIME type
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      
      if (mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else {
        // For documents and other files
        resourceType = 'raw';
      }

      const options: UploadOptions = {
        folder: `cellar/${resourceType}s`, // Creates folders like 'cellar/images', 'cellar/videos', 'cellar/raw'
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        // For raw files, we want to keep the original format
        ...(resourceType === 'raw' && { resource_type: 'raw' }),
      };

      try {
        const result = await uploadFromBuffer(buffer, options);
        return {
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
          },
        };
      } catch (error) {
        console.error(
          `[uploadMultipleFiles] Error uploading file ${originalname}:`,
          error
        );
        return {
          success: false,
          error: `Failed to upload ${originalname}`,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const allSuccessful = results.every((result) => result.success);

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      data: results,
    });
  } catch (error) {
    console.error('[uploadMultipleFiles] Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while uploading files',
    });
  }
};

/**
 * Delete a file
 */
export const deleteUpload = async (
  req: DeleteUploadRequest,
  res: Response
): Promise<void> => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'Public ID is required',
      });
      return;
    }

    await deleteFile(publicId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('[deleteUpload] Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting the file',
    });
  }
};

/**
 * Delete multiple files
 */
export const deleteMultipleUploads = async (
  req: DeleteMultipleUploadsRequest,
  res: Response
): Promise<void> => {
  try {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Public IDs array is required',
      });
      return;
    }

    const results = await deleteFiles(publicIds);
    const allSuccessful = results.every((result) => result.success);

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      data: results,
    });
  } catch (error) {
    console.error('[deleteMultipleUploads] Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting files',
    });
  }
};

export default {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUpload,
  deleteMultipleUploads,
};
