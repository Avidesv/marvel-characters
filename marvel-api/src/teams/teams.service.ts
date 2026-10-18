import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from './team.entity';
import { Character } from '../characters/character.entity';
import { AssignCharactersDto, CreateTeamDto, UpdateTeamDto } from './teams.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teams: Repository<Team>,
    @InjectRepository(Character) private readonly characters: Repository<Character>,
  ) {}

  list() {
    return this.teams.find();
  }

  async get(id: number) {
    const team = await this.teams.findOneBy({ id });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  async listCharacters(id: number) {
    await this.get(id);
    return this.characters.find({ where: { team: { id } } });
  }

  async verifyCharacters(ids: number[]) {
    if (ids.length === 0) return;
    const count = await this.characters.countBy({ id: In(ids) });
    if (count !== ids.length) throw new NotFoundException('Personaje no encontrado');
  }

  async create(data: CreateTeamDto) {
    if (await this.teams.existsBy({ name: data.name })) {
      throw new ConflictException('El nombre ya existe');
    }

    const { characterIds = [], ...fields } = data;
    await this.verifyCharacters(characterIds);

    if (characterIds.length > 0 && fields.active === false) {
      throw new BadRequestException('El equipo está inactivo');
    }

    const team = await this.teams.save(this.teams.create(fields));
    if (characterIds.length > 0) {
      await this.characters.update({ id: In(characterIds) }, { team });
    }
    return team;
  }

  async replace(id: number, data: UpdateTeamDto) {
    const team = await this.get(id);
    const existing = await this.teams.findOneBy({ name: data.name });
    if (existing && existing.id !== id) throw new ConflictException('El nombre ya existe');

    return this.teams.save({
      ...team,
      name: data.name,
      base: data.base ?? null,
      founded_year: data.founded_year ?? null,
      active: data.active,
    });
  }

  async assignCharacters(id: number, data: AssignCharactersDto) {
    const team = await this.get(id);
    await this.verifyCharacters(data.characterIds);
    if (!team.active) throw new BadRequestException('El equipo está inactivo');

    if (data.characterIds.length > 0) {
      await this.characters.update({ id: In(data.characterIds) }, { team });
    }
    return this.listCharacters(id);
  }

  async remove(id: number) {
    const team = await this.get(id);
    const count = await this.characters.countBy({ team: { id } });
    if (count > 0) throw new ConflictException('El equipo tiene personajes asociados');

    await this.teams.remove(team);
    return { message: 'Equipo eliminado' };
  }
}
