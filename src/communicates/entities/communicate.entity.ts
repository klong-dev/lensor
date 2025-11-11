import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Forum } from '../../forums/entities/forum.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('communicates')
export class Communicate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'forum_id', type: 'uuid' })
  forumId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl?: string;

  @Column({ type: 'varchar', length: 50, default: 'public' })
  type: string; // 'public', 'private', 'restricted'

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Forum, (forum) => forum.communicates)
  @JoinColumn({ name: 'forum_id' })
  forum: Forum;

  @OneToMany(() => Post, (post) => post.communicate)
  posts: Post[];

  // Virtual fields
  postCount?: number;
  memberCount?: number;
}
