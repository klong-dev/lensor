import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('post_likes')
@Unique(['postId', 'userId']) // One user can only like a post once
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
