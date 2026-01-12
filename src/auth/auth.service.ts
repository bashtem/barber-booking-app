import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from 'src/customers/customers.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {

    constructor(
    private customersService: CustomersService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; phone: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const customer = await this.customersService.create({
      ...data,
      password: hashedPassword,
    });
    
    const token = this.generateToken(customer);
    return { customer, token };
  }

  async login(email: string, password: string) {
    const customer = await this.customersService.findByEmail(email);
    
    if (!customer || !customer.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(customer);
    return { customer, token };
  }

  private generateToken(customer: any) {
    return this.jwtService.sign({
      sub: customer.id,
      email: customer.email,
      role: customer.role,
    });
  }

  async validateUser(id: number) {
    return this.customersService.findOne(id);
  }
}
