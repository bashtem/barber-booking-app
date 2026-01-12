import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BarberAvailability } from './availability.entity';
import { Repository } from 'typeorm';
import { AppointmentsService } from 'src/appointments/appointments.service';
import { AvailabilityType } from 'src/enums/availability.enum';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(BarberAvailability)
    private availabilityRepo: Repository<BarberAvailability>,
    private appointmentsService: AppointmentsService,
  ) {}

  async setRegularHours(barberId: number, schedule: any[]) {
    // Delete existing regular hours
    await this.availabilityRepo.delete({
      barber: { id: barberId },
      type: AvailabilityType.REGULAR,
    });

    // Create new schedule
    const availability = schedule.map((s) =>
      this.availabilityRepo.create({
        barber: { id: barberId },
        type: AvailabilityType.REGULAR,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: true,
      }),
    );

    return this.availabilityRepo.save(availability);
  }

  async setTimeOff(
    barberId: number,
    date: Date,
    startTime: string,
    endTime: string,
    reason?: string,
  ) {
    const timeOff = this.availabilityRepo.create({
      barber: { id: barberId },
      type: AvailabilityType.TIME_OFF,
      specificDate: date,
      startTime,
      endTime,
      isAvailable: false,
      reason,
    });

    return this.availabilityRepo.save(timeOff);
  }

  async getAvailableSlots(
    barberId: number,
    date: Date,
    duration: number = 30,
  ): Promise<string[]> {
    const dayOfWeek = date.getDay();

    // Get regular hours for this day
    const regularHours = await this.availabilityRepo.findOne({
      where: {
        barber: { id: barberId },
        type: AvailabilityType.REGULAR,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!regularHours) return [];

    // Check for time off on specific date
    const timeOff = await this.availabilityRepo.find({
      where: {
        barber: { id: barberId },
        type: AvailabilityType.TIME_OFF,
        specificDate: date,
      },
    });

    // Get existing appointments
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentsService.findByBarberAndDate(
      barberId,
      startOfDay,
      endOfDay,
    );

    // Generate time slots
    const slots = this.generateTimeSlots(
      regularHours.startTime,
      regularHours.endTime,
      duration,
    );

    // Filter out booked slots and time off
    return slots.filter((slot) => {
      const slotTime = this.parseTime(slot);

      // Check time off
      for (const off of timeOff) {
        const offStart = this.parseTime(off.startTime);
        const offEnd = this.parseTime(off.endTime);
        if (slotTime >= offStart && slotTime < offEnd) {
          return false;
        }
      }

      // Check appointments
      for (const apt of appointments) {
        const aptStart = new Date(apt.appointmentDate);
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
        const slotDate = new Date(date);
        slotDate.setHours(slotTime.getHours(), slotTime.getMinutes());

        if (slotDate >= aptStart && slotDate < aptEnd) {
          return false;
        }
      }

      return true;
    });
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
  ): string[] {
    const slots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const hours = current.getHours().toString().padStart(2, '0');
      const minutes = current.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
      current = new Date(current.getTime() + duration * 60000);
    }

    return slots;
  }

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
