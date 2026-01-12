import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.customersRepository.create(customerData);
    return this.customersRepository.save(customer);
  }

  async findByTelegramId(telegramId: string): Promise<Customer | null> {
    return this.customersRepository.findOne({ where: { telegramId } });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customersRepository.findOne({ where: { phone } });
  }

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find();
  }
}
