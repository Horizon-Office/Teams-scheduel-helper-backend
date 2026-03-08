import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Event } from '../../team-event/entities/team_event.entity';
import { Member } from '../../../members/entities/member.entity';

@Entity('team')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'int', default: 0 })
  student_count: number;

  @Column({ type: 'int', default: 0 })
  week_count: number;

  @Column({ type: 'int', default: 0 })
  hours_perWeek_count: number;

  @Column({ type: 'int', default: 0 })
  hours_perWeek_practice_count: number;

  @Column({ length: 10, default: '' })
  quarter: string; // "1", "2", "1 , 2"

  @Column({ type: 'int', default: 0 })
  lecture_hours: number;

  @Column({ length: 50, default: '' })
  practice_type: string; // "лаб" | "пр.р" | ""

  @Column({ length: 255, default: '' })
  teacher_lecture: string;

  @Column({ length: 255, default: '' })
  teacher_practice: string;

  @Column({ type: 'int', default: 0 })
  placed_hours: number;

  @Column('text', { array: true, default: [] })
  groups: string[];

  @Column('text', { array: true, default: [] })
  practice_groups: string[];

  @ManyToMany(() => Member, (member) => member.teams, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'team_member',
  })
  members: Member[];

  @ManyToMany(() => Order, (order) => order.teams)
  @JoinTable({
    name: 'order_team',
  })
  orders: Order[];

  @ManyToMany(() => Order, (order) => order.practiceTeams)
  @JoinTable({
    name: 'practice_order_team', // отдельная таблица!
  })
  practiceOrders: Order[];

  @OneToMany(() => Event, (event) => event.team, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'team_event',
  })
  events: Event[];

}
