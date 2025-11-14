import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string; // Seller ID

  @Column('uuid')
  bankCardId: string; // Bank card used for withdrawal

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Tổng số tiền từ orders (trước khi trừ phí)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number; // Phí hệ thống (17%)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualAmount: number; // Số tiền thực nhận (amount - fee)

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, approved, rejected

  @Column({ type: 'json' })
  orderIds: string[]; // Array of order IDs being withdrawn

  @Column({ type: 'json', nullable: true })
  bankInfo: any; // Snapshot of bank card info at time of withdrawal

  @Column({ type: 'text', nullable: true })
  note: string; // Note from seller

  @Column({ type: 'uuid', nullable: true })
  adminId: string; // Admin who processed the withdrawal

  @Column({ type: 'text', nullable: true })
  adminResponse: string; // Response from admin (reason for rejection)

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date; // When admin processed the withdrawal

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
