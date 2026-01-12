import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@Request() req) {
    return this.customersService.findOne(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(@Request() req, @Body() data: Partial<Customer>) {
    return this.customersService.update(req.user.id, data);
  }
}
