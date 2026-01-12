import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
