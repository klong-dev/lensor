import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

export enum VoteType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum VoteValue {
  UP = 1,
  DOWN = -1,
}

@Entity('votes')
@Index(['userId', 'targetId', 'targetType'], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: VoteType,
  })
  targetType: VoteType;

  @Column({
    type: 'smallint',
  })
  value: VoteValue;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.votes, { nullable: true })
  @JoinColumn({ name: 'target_id' })
  post?: Post;
}
