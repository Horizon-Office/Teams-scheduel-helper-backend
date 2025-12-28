import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Team } from '../../schedule/team/entities/team.entity';

@Entity('member')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  department: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @ManyToMany(() => Team, (team) => team.members)
  teams: Team[];
}
