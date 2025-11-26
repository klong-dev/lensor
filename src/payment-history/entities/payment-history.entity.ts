import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_history')
export class PaymentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // vnpay, paypal, wallet

  @Column({ type: 'varchar', length: 50 })
  transactionType: string; // deposit, payment, refund, withdrawal

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // pending, completed, failed, cancelled

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string; // External transaction ID from payment gateway

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional data (payment gateway response, etc.)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
