import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vote } from '../../vote/entities/vote.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];

  // Virtual fields (không lưu trong DB)
  voteCount?: number;
  commentCount?: number;

  // User info from Supabase
  user?: {
    id: string;
    name: string;
    avatarUrl: string;
    isFollowed: boolean;
  };
}
