import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  subject: string;

  @Column('text')
  content: string;

  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @Column({ type: 'timestamptz' })
  endDateTime: Date;

  @Column({ type: 'date' })
  startDateRange: Date;

  @Column({ type: 'date' })
  endDateRange: Date;

  @Column()
  type: string;

  @Column('int')
  interval: number;

  @Column('simple-array')
  daysOfWeek: string[];

  @ManyToMany(() => Team, (team) => team.events)
  teams: Team[];
}
