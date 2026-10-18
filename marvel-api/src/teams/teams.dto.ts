import {
  ArrayUnique, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional,
  IsString, Max, MaxLength, Min,
} from 'class-validator';

export class CreateTeamDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsOptional() @IsString() @MaxLength(150)
  base?: string | null;

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  founded_year?: number | null;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(1, { each: true })
  characterIds?: number[];
}

export class UpdateTeamDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsOptional() @IsString() @MaxLength(150)
  base?: string | null;

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  founded_year?: number | null;

  @IsBoolean()
  active: boolean;
}

export class AssignCharactersDto {
  @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(1, { each: true })
  characterIds: number[];
}
