import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
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

  @OneToMany(() => Team, (team) => team.member)
  teams: Team[];
}
