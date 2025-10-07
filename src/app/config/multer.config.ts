import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryUpload } from './cloudinary.config';

const removeExtension = (filename: string) => {
  return filename.split('.').slice(0, -1).join('.');
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (_req, file) => {
    let resource_type: 'image' | 'video' | 'raw' = 'raw';

    if (file.mimetype.startsWith('image/')) resource_type = 'image';
    else if (file.mimetype.startsWith('video/')) resource_type = 'video';
    else if (file.mimetype.startsWith('audio/')) resource_type = 'video';

    return {
      public_id:
        Math.random().toString(36).substring(2) +
        '-' +
        Date.now() +
        '-' +
        file.fieldname +
        '-' +
        removeExtension(file.originalname),
      resource_type,
    };
  },
});

export const multerUpload = multer({ storage });
