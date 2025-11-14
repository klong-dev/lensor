import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // report_created, report_approved, report_rejected, order_ready_for_withdrawal, etc.

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'uuid', nullable: true })
  targetId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType: string; // 'post', 'comment', 'vote', 'order', 'report', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actionUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  time: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
