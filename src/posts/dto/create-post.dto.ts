import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsOptional()
  imageMetadata?: {
    // Basic Image Info
    width?: number;
    height?: number;
    dimensions?: string;
    fileSize?: number;
    format?: string;
    colorSpace?: string;
    bitDepth?: number;
    dpi?: number;
    orientation?: number;

    // Camera Info
    cameraMake?: string;
    cameraModel?: string;
    cameraSerialNumber?: string;

    // Lens Info
    lensMake?: string;
    lensModel?: string;
    lensSerialNumber?: string;
    focalLength?: string;
    focalLengthIn35mm?: string;

    // Exposure Settings
    iso?: number;
    aperture?: string;
    fStop?: string;
    shutterSpeed?: string;
    exposureTime?: string;
    exposureMode?: string;
    exposureProgram?: string;
    exposureBias?: string;
    meteringMode?: string;

    // Flash & Lighting
    flash?: string;
    flashMode?: string;
    whiteBalance?: string;
    lightSource?: string;

    // Other Settings
    focusMode?: string;
    focusDistance?: string;
    dateTimeOriginal?: string;
    dateTimeDigitized?: string;
    dateTime?: string;
    timezone?: string;

    // Author & Copyright
    artist?: string;
    author?: string;
    copyright?: string;

    // Software & Processing
    software?: string;
    processingMethod?: string;

    // GPS Location
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    gpsLocation?: string;

    // Additional Info
    contrast?: string;
    saturation?: string;
    sharpness?: string;
    brightness?: string;
    gainControl?: string;
    digitalZoomRatio?: string;
    sceneType?: string;
    sceneCaptureType?: string;
    subjectDistance?: string;
    subjectDistanceRange?: string;

    // RAW Processing
    rawProcessing?: string;
    toneMapping?: string;
    colorGrading?: string;
  };
}
