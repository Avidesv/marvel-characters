import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, RelationId, UpdateDateColumn,
} from 'typeorm';
import { Team } from '../teams/team.entity';

export enum CharacterStatus {
  ACTIVE = 'ACTIVE',
  INJURED = 'INJURED',
  MISSING = 'MISSING',
  RETIRED = 'RETIRED',
}

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  real_name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  alias: string;

  @Column({ type: 'varchar', length: 150 })
  main_power: string;

  @Column({ type: 'integer' })
  power_level: number;

  @Column({ type: 'varchar', length: 20, default: CharacterStatus.ACTIVE })
  status: CharacterStatus;

  @Column({ type: 'boolean', default: false })
  is_villain: boolean;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team: Team | null;

  @RelationId((character: Character) => character.team)
  team_id: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
