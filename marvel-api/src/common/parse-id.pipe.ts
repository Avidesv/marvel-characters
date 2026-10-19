import { BadRequestException, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException('El id debe ser un número entero');
    }
    const id = Number(value);
    if (Math.abs(id) > 2147483647) {
      throw new NotFoundException('Recurso no encontrado');
    }
    return id;
  }
}