import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { Order } from 'src/schedule/order/entities/order.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  subject: string;

  @Column('text')
  content: string;

  @Column({ type: 'time', nullable: true })
  startTime: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'date', nullable: true })
  startDateRange: string | null;

  @Column({ type: 'date', nullable: true })
  endDateRange: string | null;

  @Column({ type: 'varchar', nullable: true })
  type: string | null;

  @Column({ type: 'int', nullable: true })
  interval: number | null;

  @Column({ type: 'simple-array', nullable: true })
  daysOfWeek: string[] | null;


  @ManyToOne(() => Team, (team) => team.events, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToMany(() => Order, (order) => order.events)
  orders: Order[];
}