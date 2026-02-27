import { v2 as cloudinary } from 'cloudinary';
import { Env } from './constants/Env';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: Env.CLOUDINARY_CLOUD_NAME,
  api_key: Env.CLOUDINARY_API_KEY,
  api_secret: Env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadOptions = {
  folder?: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  allowed_formats?: string[];
  transformation?: Record<string, any>;
  overwrite?: boolean;
  invalidate?: boolean;
};

export type UploadResult = {
  /** The URL of the uploaded file */
  url: string;
  /** The public ID of the uploaded file */
  public_id: string;
  /** The secure URL of the uploaded file (HTTPS) */
  secure_url: string;
  /** The file format */
  format: string;
  /** The type of the resource (image, video, etc.) */
  resource_type: string;
  /** The size of the file in bytes */
  bytes: number;
  /** The width of the file (if applicable) */
  width?: number;
  /** The height of the file (if applicable) */
  height?: number;
  /** The timestamp when the file was created */
  created_at: string;
};

/**
 * Uploads a file to Cloudinary from a buffer
 * @param fileBuffer - The file buffer to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadFromBuffer(
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: options.resource_type || 'auto',
        allowed_formats: options.allowed_formats,
        transformation: options.transformation,
        overwrite: options.overwrite,
        invalidate: options.invalidate,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('No result returned from Cloudinary'));
        }
        resolve({
          url: result.url,
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          created_at: result.created_at,
        });
      }
    );

    // Create a readable stream from the buffer and pipe it to Cloudinary
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null); // Signal the end of the stream
    readable.pipe(uploadStream);
  });
}

/**
 * Uploads a file to Cloudinary from a URL
 * @param fileUrl - The URL of the file to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadFromUrl(
  fileUrl: string,
  options: Omit<UploadOptions, 'public_id'> & { public_id?: string } = {}
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(fileUrl, {
      folder: options.folder,
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto',
      allowed_formats: options.allowed_formats,
      transformation: options.transformation,
      overwrite: options.overwrite,
      invalidate: options.invalidate,
    });

    return {
      url: result.url,
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload from URL error:', error);
    throw error;
  }
}

/**
 * Deletes a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param options - Delete options
 * @returns Promise with deletion result
 */
export async function deleteFile(
  publicId: string,
  options: { resource_type?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'image',
      invalidate: true,
    });

    if (result.result !== 'ok') {
      throw new Error(`Failed to delete file: ${result.result}`);
    }

    return { result: result.result };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Deletes multiple files from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @param options - Delete options
 * @returns Promise with deletion results
 */
export async function deleteFiles(
  publicIds: string[],
  options: { resource_type?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<Array<{ public_id: string; success: boolean; error?: string }>> {
  try {
    const results = await Promise.all(
      publicIds.map(async (publicId) => {
        try {
          await deleteFile(publicId, options);
          return { public_id: publicId, success: true };
        } catch (error) {
          return {
            public_id: publicId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Cloudinary batch delete error:', error);
    throw error;
  }
}

export default {
  uploadFromBuffer,
  uploadFromUrl,
  deleteFile,
  deleteFiles,
};
