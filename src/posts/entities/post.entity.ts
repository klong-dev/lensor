import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vote } from '../../vote/entities/vote.entity';
import { Category } from '../../categories/entities/category.entity';
import { Communicate } from '../../communicates/entities/communicate.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'communicate_id', type: 'uuid', nullable: true })
  communicateId?: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ name: 'is_saved', type: 'boolean', default: false })
  isSaved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToOne(() => Communicate, (communicate) => communicate.posts)
  @JoinColumn({ name: 'communicate_id' })
  communicate?: Communicate;

  // Virtual fields (không lưu trong DB)
  voteCount?: number;
  commentCount?: number;
  isLiked?: boolean;

  // User info from Supabase
  user?: {
    id: string;
    name: string;
    avatarUrl: string;
    isFollowed: boolean;
  };
}
