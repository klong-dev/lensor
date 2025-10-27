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

  @Column({ type: 'simple-array', nullable: true })
  imagePairs: string; // JSON string: [{before: '', after: ''}]

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  downloads: number;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string;

  @Column({ type: 'simple-array', nullable: true })
  compatibility: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileFormat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileSize: string;

  @Column({ type: 'int', default: 0 })
  includesCount: number;

  @Column({ type: 'simple-array', nullable: true })
  features: string;

  @Column({ type: 'text', nullable: true })
  specifications: string; // JSON string

  @Column({ type: 'text', nullable: true })
  warranty: string; // JSON string

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
