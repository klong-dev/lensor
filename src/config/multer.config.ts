import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const multerConfig: MulterOptions = {
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 20, // Max 20 files per request
  },
  fileFilter: (req, file, callback) => {
    // Allowed extensions
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      // RAW formats
      'image/x-canon-cr2',
      'image/x-canon-cr3',
      'image/x-sony-arw',
      'image/x-nikon-nef',
      'image/x-fuji-raf',
      'image/x-adobe-dng',
      'image/x-panasonic-rw2',
      // Preset files
      'application/octet-stream', // .xmp, .dng presets
      'application/xml', // .xmp files
      'text/xml', // .xmp files
    ];

    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      // Images
      'jpg',
      'jpeg',
      'png',
      'webp',
      // RAW formats
      'cr2',
      'cr3',
      'arw',
      'nef',
      'raf',
      'dng',
      'rw2',
      // Preset files
      'xmp', // Adobe Lightroom presets
      'lrtemplate', // Lightroom templates
      'dcp', // DNG Camera Profile
    ];

    if (
      allowedMimes.includes(file.mimetype) ||
      (fileExt && allowedExtensions.includes(fileExt))
    ) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
        ),
        false,
      );
    }
  },
};
