import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @OneToMany(() => Order, (order) => order.faculty)
  orders: Order[];
  
}
