import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
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

  @ManyToMany(() => Event, (event) => event.teams, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'team_event',
  })
  events: Event[];

}
