import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
