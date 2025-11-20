import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages)
  ticket: Ticket;

  @Column({ type: 'uuid' })
  sender: string;

  @Column('text')
  message: string;

  @Column('json', { nullable: true })
  attachments?: string[];

  @CreateDateColumn()
  createdAt: Date;
}
