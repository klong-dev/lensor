import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('system_variables')
export class SystemVariable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column('float')
  value: number;
}
