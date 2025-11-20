import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketMessage } from './ticket-message.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ nullable: true })
  category: string;

  @Column('uuid')
  createdBy: string;

  @Column('uuid', { nullable: true })
  assignedTo?: string;

  @Column('json', { nullable: true })
  attachments?: string[];

  @OneToMany(() => TicketMessage, (msg) => msg.ticket)
  messages: TicketMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;
}
