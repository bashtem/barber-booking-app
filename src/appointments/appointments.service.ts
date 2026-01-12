import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Between, Repository } from 'typeorm';
import { AppointmentStatus } from 'src/enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
    constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async create(appointmentData: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create(appointmentData);
    return this.appointmentsRepository.save(appointment);
  }

  async findByCustomer(customerId: number): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { customer: { id: customerId } },
      relations: ['barber', 'customer'],
      order: { appointmentDate: 'DESC' }
    });
  }

  async findUpcoming(): Promise<Appointment[]> {
    const now = new Date();
    return this.appointmentsRepository.find({
      where: {
        appointmentDate: Between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
        status: AppointmentStatus.CONFIRMED
      },
      relations: ['barber', 'customer'],
      order: { appointmentDate: 'ASC' }
    });
  }

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment | null> {
    await this.appointmentsRepository.update(id, { status });
    return this.appointmentsRepository.findOne({ 
      where: { id },
      relations: ['barber', 'customer']
    });
  }

  async findOne(id: number): Promise<Appointment | null> {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['barber', 'customer']
    });
  }
}
