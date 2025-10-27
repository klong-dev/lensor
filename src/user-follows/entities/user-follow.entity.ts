import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_follows')
export class UserFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'follower_id', type: 'uuid' })
  followerId: string;

  @Column({ name: 'following_id', type: 'uuid' })
  followingId: string;

  @Column({ name: 'notify_on_post', type: 'boolean', default: true })
  notifyOnPost: boolean;

  @Column({ name: 'notify_on_comment', type: 'boolean', default: true })
  notifyOnComment: boolean;

  @Column({ name: 'notify_on_vote', type: 'boolean', default: false })
  notifyOnVote: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
