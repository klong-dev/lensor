import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string; // Buyer ID

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, completed, failed, refunded, reported, ready_for_withdrawal

  @Column({ type: 'varchar', length: 50, default: 'wallet' })
  paymentMethod: string; // wallet, vnpay, paypal

  @Column({ type: 'varchar', nullable: true })
  transactionId: string;

  @Column({ type: 'json' })
  items: any; // Array of {productId, productTitle, quantity, price, subtotal, sellerId}

  @Column({ type: 'boolean', default: false })
  canWithdraw: boolean; // True after 3 days if no report

  @Column({ type: 'timestamp', nullable: true })
  withdrawableAt: Date; // Date when seller can withdraw (createdAt + 3 days)

  @Column({ type: 'uuid', nullable: true })
  reportId: string; // If order is reported

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string; // Reason if rejected due to report

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
