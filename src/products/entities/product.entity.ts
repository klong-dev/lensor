import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductReview } from './product-review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail: string;

  @Column({ type: 'text', nullable: true })
  imagePairs: string; // JSON string: [{before: '', after: ''}]

  @Column({ type: 'text', nullable: true })
  presetFiles: string; // JSON string array of preset file URLs (.xmp, .dng, .lrtemplate)

  @Column({ type: 'jsonb', nullable: true })
  imageMetadata: {
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

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  sellCount: number;

  @Column({ type: 'int', default: 0 })
  downloads: number;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  tags: string; // Comma-separated string

  @Column({ type: 'text', nullable: true })
  compatibility: string; // Comma-separated string

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileFormat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileSize: string;

  @Column({ type: 'int', default: 0 })
  includesCount: number;

  @Column({ type: 'text', nullable: true })
  features: string; // Comma-separated string

  @Column({ type: 'text', nullable: true })
  specifications: string; // JSON string

  @Column({ type: 'text', nullable: true })
  warranty: string; // JSON string

  @Column({
    type: 'enum',
    enum: ['active', 'blocked', 'deleted'],
    default: 'active',
  })
  status: 'active' | 'blocked' | 'deleted';

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
