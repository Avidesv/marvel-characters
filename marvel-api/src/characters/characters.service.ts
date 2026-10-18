import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/team.entity';
import { Character, CharacterStatus } from './character.entity';
import { ChangeStatusDto, CreateCharacterDto, FilterCharactersDto, UpdateCharacterDto } from './characters.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private readonly characters: Repository<Character>,
    @InjectRepository(Team) private readonly teams: Repository<Team>,
  ) {}

  list(filter: FilterCharactersDto) {
    return this.characters.find({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.teamId ? { team: { id: filter.teamId } } : {}),
      },
    });
  }

  async get(id: number) {
    const character = await this.characters.findOne({ where: { id }, relations: { team: true } });
    if (!character) throw new NotFoundException('Personaje no encontrado');
    return character;
  }

  async verifyTeam(id: number | null | undefined) {
    if (id === null || id === undefined) return null;

    const team = await this.teams.findOneBy({ id });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    if (!team.active) throw new BadRequestException('El equipo está inactivo');
    return team;
  }

  checkStatus(previous: CharacterStatus, next: CharacterStatus) {
    if (previous === CharacterStatus.RETIRED && next === CharacterStatus.INJURED) {
      throw new BadRequestException('Cambio de estado no permitido');
    }
  }

  async create(data: CreateCharacterDto) {
    if (await this.characters.existsBy({ alias: data.alias })) {
      throw new ConflictException('El alias ya existe');
    }

    const { team_id, ...fields } = data;
    const team = await this.verifyTeam(team_id);
    const character = await this.characters.save(this.characters.create({ ...fields, team }));
    return this.get(character.id);
  }

  async replace(id: number, data: UpdateCharacterDto) {
    const character = await this.get(id);
    const existing = await this.characters.findOneBy({ alias: data.alias });
    if (existing && existing.id !== id) throw new ConflictException('El alias ya existe');

    this.checkStatus(character.status, data.status);
    const { team_id, ...fields } = data;
    const team = await this.verifyTeam(team_id);
    await this.characters.save({ ...character, ...fields, team });
    return this.get(id);
  }

  async changeStatus(id: number, data: ChangeStatusDto) {
    const character = await this.get(id);
    this.checkStatus(character.status, data.status);
    await this.characters.update(id, { status: data.status });
    return this.get(id);
  }

  async remove(id: number) {
    await this.get(id);
    await this.characters.delete(id);
    return { message: 'Personaje eliminado' };
  }
}
