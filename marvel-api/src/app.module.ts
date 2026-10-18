import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './teams/team.entity';
import { Character } from './characters/character.entity';
import { TeamsModule } from './teams/teams.module';
import { CharactersModule } from './characters/characters.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'marvel',
      password: 'marvel123',
      database: 'marvel_db',
      entities: [Team, Character],
      synchronize: false,
    }),
    TeamsModule,
    CharactersModule,
  ],
})
export class AppModule {}
