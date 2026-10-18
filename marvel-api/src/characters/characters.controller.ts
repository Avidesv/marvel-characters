import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { ChangeStatusDto, CreateCharacterDto, FilterCharactersDto, UpdateCharacterDto } from './characters.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly service: CharactersService) {}

  @Get()
  list(@Query() filter: FilterCharactersDto) { return this.service.list(filter); }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) { return this.service.get(id); }

  @Post()
  create(@Body() data: CreateCharacterDto) { return this.service.create(data); }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCharacterDto) {
    return this.service.replace(id, data);
  }

  @Patch(':id/status')
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() data: ChangeStatusDto) {
    return this.service.changeStatus(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
