import {
  IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional,
  IsString, Max, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CharacterStatus } from './character.entity';

export class CreateCharacterDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  real_name: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  alias: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  main_power: string;

  @IsInt() @Min(1) @Max(100)
  power_level: number;

  @IsOptional() @IsEnum(CharacterStatus)
  status?: CharacterStatus;

  @IsOptional() @IsBoolean()
  is_villain?: boolean;

  @IsOptional() @IsInt() @Min(1)
  team_id?: number | null;
}

export class UpdateCharacterDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  real_name: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  alias: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  main_power: string;

  @IsInt() @Min(1) @Max(100)
  power_level: number;

  @IsEnum(CharacterStatus)
  status: CharacterStatus;

  @IsBoolean()
  is_villain: boolean;

  @IsOptional() @IsInt() @Min(1)
  team_id?: number | null;
}

export class ChangeStatusDto {
  @IsEnum(CharacterStatus)
  status: CharacterStatus;
}

export class FilterCharactersDto {
  @IsOptional() @IsEnum(CharacterStatus)
  status?: CharacterStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  teamId?: number;
}
