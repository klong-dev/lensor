import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber()
  @Min(0)
  price: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value) : value,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsOptional()
  imagePairs?: Array<{ before: string; after: string }>;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  presetFiles?: string[];

  @IsString()
  category: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  compatibility?: string[];

  @IsString()
  @IsOptional()
  fileFormat?: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value) : value,
  )
  @IsNumber()
  @IsOptional()
  includesCount?: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsOptional()
  specifications?: {
    adjustments?: string[];
    bestFor?: string[];
    difficulty?: string;
  };

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsOptional()
  warranty?: {
    duration?: string;
    coverage?: string;
    terms?: string[];
  };

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
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
