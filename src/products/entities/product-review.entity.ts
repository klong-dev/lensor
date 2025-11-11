import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  userName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAvatar: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'int', default: 0 })
  helpful: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
