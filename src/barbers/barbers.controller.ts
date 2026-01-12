import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BarbersService } from './barbers.service';
import { AuthGuard } from '@nestjs/passport';
import { Barber } from './barber.entity';

@ApiTags('Barbers')
@Controller('barbers')
export class BarbersController {
  constructor(private barbersService: BarbersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all barbers' })
  async findAll(
    @Query('specialty') specialty?: string,
    @Query('minRating') minRating?: number,
  ) {
    return this.barbersService.findAll({ specialty, minRating });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get barber by ID' })
  async findOne(@Param('id') id: string) {
    return this.barbersService.findOne(+id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new barber' })
  async create(@Body() data: Partial<Barber>) {
    return this.barbersService.create(data);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update barber' })
  async update(@Param('id') id: string, @Body() data: Partial<Barber>) {
    return this.barbersService.update(+id, data);
  }
}
