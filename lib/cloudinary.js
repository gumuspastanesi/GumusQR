import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (base64Data, folder = 'products') => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `gumusqr/${folder}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary')) return;
  try {
    const parts = imageUrl.split('/');
    const folderIndex = parts.findIndex(p => p === 'gumusqr');
    if (folderIndex === -1) return;
    const publicIdWithExt = parts.slice(folderIndex).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};