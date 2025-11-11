import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Communicate } from '../../communicates/entities/communicate.entity';

@Entity('forums')
export class Forum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl?: string;

  @Column({ name: 'cover_url', type: 'varchar', nullable: true })
  coverUrl?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Communicate, (communicate) => communicate.forum)
  communicates: Communicate[];

  // Virtual fields
  communicateCount?: number;
  memberCount?: number;
}
