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

  @ManyToOne(() => Member, (member) => member.teams, {
    onDelete: 'CASCADE',
  })
  member: Member;

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
