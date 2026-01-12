import { Module } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './barber.entity';
import { BarbersController } from './barbers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Barber])],
  providers: [BarbersService],
  exports: [BarbersService],
  controllers: [BarbersController],
})
export class BarbersModule {}
