import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vote } from '../../vote/entities/vote.entity';
import { Category } from '../../categories/entities/category.entity';
import { Communicate } from '../../communicates/entities/communicate.entity';
import { PostLike } from '../../post-likes/entities/post-like.entity';
import { PostComment } from '../../post-comments/entities/post-comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'communicate_id', type: 'uuid', nullable: true })
  communicateId?: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
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

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ name: 'is_saved', type: 'boolean', default: false })
  isSaved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToOne(() => Communicate, (communicate) => communicate.posts)
  @JoinColumn({ name: 'communicate_id' })
  communicate?: Communicate;

  // Virtual fields (không lưu trong DB)
  isLiked?: boolean;

  // User info from Supabase
  user?: {
    id: string;
    name: string;
    avatarUrl: string;
    isFollowed: boolean;
  };
}
