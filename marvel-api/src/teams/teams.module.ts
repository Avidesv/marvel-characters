import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './team.entity';
import { Character } from '../characters/character.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Character])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
