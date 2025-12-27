import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  student_count: number;

  @Column()
  department: string;

  @ManyToMany(() => Team, (team) => team.orders)
  teams: Team[];
}
