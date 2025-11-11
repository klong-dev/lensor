import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  roomId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => ChatRoom, (room) => room.messages)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @CreateDateColumn()
  createdAt: Date;
}
