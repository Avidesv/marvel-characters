import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AssignCharactersDto, CreateTeamDto, UpdateTeamDto } from './teams.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  list() { return this.service.list(); }

  @Get(':id/characters')
  listCharacters(@Param('id', ParseIntPipe) id: number) {
    return this.service.listCharacters(id);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) { return this.service.get(id); }

  @Post()
  create(@Body() data: CreateTeamDto) { return this.service.create(data); }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateTeamDto) {
    return this.service.replace(id, data);
  }

  @Patch(':id/characters')
  assign(@Param('id', ParseIntPipe) id: number, @Body() data: AssignCharactersDto) {
    return this.service.assignCharacters(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
