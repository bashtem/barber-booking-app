import { Module } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './barber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barber])],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}
