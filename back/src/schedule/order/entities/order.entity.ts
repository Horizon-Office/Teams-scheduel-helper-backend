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
import { Event } from 'src/schedule/team-event/entities/team_event.entity';
import { JoinTable } from 'typeorm'; 


@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  student_count: number;

  @Column({ type: 'boolean', default: false })
  imported: boolean;


  @ManyToOne(() => Faculty, (faculty) => faculty.orders, { nullable: false })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @ManyToMany(() => Team, (team) => team.orders)
  teams: Team[];

  @ManyToMany(() => Team, (team) => team.practiceOrders)
  practiceTeams: Team[]; 

  @ManyToMany(() => Event, (event) => event.orders)
  @JoinTable({
    name: 'order_events',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'event_id', referencedColumnName: 'id' },
  })
  events: Event[];
}
