import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get('slots/:barberId')
  @ApiOperation({ summary: 'Get available time slots for a barber' })
  async getAvailableSlots(
    @Param('barberId') barberId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    return this.availabilityService.getAvailableSlots(
      +barberId,
      new Date(date),
      duration ? +duration : 30,
    );
  }

  @Post('regular-hours/:barberId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set regular working hours for barber' })
  async setRegularHours(
    @Param('barberId') barberId: string,
    @Body() schedule: any[],
  ) {
    return this.availabilityService.setRegularHours(+barberId, schedule);
  }

  @Post('time-off/:barberId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set time off for barber' })
  async setTimeOff(
    @Param('barberId') barberId: string,
    @Body()
    data: { date: string; startTime: string; endTime: string; reason?: string },
  ) {
    return this.availabilityService.setTimeOff(
      +barberId,
      new Date(data.date),
      data.startTime,
      data.endTime,
      data.reason,
    );
  }
}
