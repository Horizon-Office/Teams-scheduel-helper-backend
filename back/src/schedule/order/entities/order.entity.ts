import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { Faculty } from 'src/schedule/faculty/entities/faculty.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  student_count: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.orders, { nullable: false })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @ManyToMany(() => Team, (team) => team.orders)
  teams: Team[];
}
