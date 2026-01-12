import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './appointment.dto';
import { AppointmentStatus } from 'src/enums/appointment.enum';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new appointment' })
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create({
      ...dto,
      customer: { id: req.user.id } as any,
      barber: { id: dto.barberId } as any,
      status: AppointmentStatus.PENDING,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get customer appointments' })
  async findAll(@Request() req) {
    return this.appointmentsService.findByCustomer(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  async findUpcoming(@Request() req) {
    return this.appointmentsService.findUpcoming(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: { status: AppointmentStatus; reason?: string },
  ) {
    return this.appointmentsService.updateStatus(+id, data.status, data.reason);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Add review to appointment' })
  async addReview(
    @Param('id') id: string,
    @Body() data: { rating: number; review: string },
  ) {
    return this.appointmentsService.addReview(+id, data.rating, data.review);
  }
}
