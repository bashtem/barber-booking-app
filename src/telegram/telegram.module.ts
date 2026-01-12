import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { CustomersModule } from 'src/customers/customers.module';
import { BarbersModule } from 'src/barbers/barbers.module';
import { AppointmentsModule } from 'src/appointments/appointments.module';

@Module({
  imports: [CustomersModule, BarbersModule, AppointmentsModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
