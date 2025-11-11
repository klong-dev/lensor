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
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, completed, failed, refunded

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // vnpay, paypal

  @Column({ type: 'varchar', nullable: true })
  transactionId: string;

  @Column({ type: 'json' })
  items: any; // Array of {productId, quantity, price}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
