import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  buyerId: string; // User who bought and is reporting

  @Column('uuid')
  sellerId: string; // User who sold the product

  @Column('uuid')
  productId: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, approved, rejected, need_more_info

  @Column({ type: 'text' })
  reason: string; // Why buyer is reporting

  @Column({ type: 'json', nullable: true })
  evidence: any; // Array of image URLs, documents, etc.

  @Column({ type: 'text', nullable: true })
  adminResponse: string; // Admin's response/reason for decision

  @Column('uuid', { nullable: true })
  adminId: string; // Admin who handled the report

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
