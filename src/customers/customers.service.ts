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

  async findOne(id: number): Promise<Customer | null> {
    return this.customersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customersRepository.findOne({ where: { email } });
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

  async update(id: number, data: Partial<Customer>): Promise<Customer | null> {
    await this.customersRepository.update(id, data);
    return this.findOne(id);
  }
}
