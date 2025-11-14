import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bank_cards')
export class BankCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string; // Owner of the card

  @Column({ type: 'varchar', length: 100 })
  bankName: string; // Tên ngân hàng (VCB, Techcombank, MB, etc.)

  @Column({ type: 'varchar', length: 50 })
  accountNumber: string; // Số tài khoản

  @Column({ type: 'varchar', length: 100 })
  accountHolder: string; // Tên chủ thẻ

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // Thẻ mặc định

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
