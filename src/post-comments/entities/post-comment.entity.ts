import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column('uuid', { nullable: true })
  parentId: string; // For nested comments/replies

  @ManyToOne(() => Post, (post) => post.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Virtual field for user info
  user?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}
