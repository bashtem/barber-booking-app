import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Between, Repository } from 'typeorm';
import { AppointmentStatus } from 'src/enums/appointment.enum';

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
      order: { appointmentDate: 'DESC' },
    });
  }

  // async findUpcoming(): Promise<Appointment[]> {
  //   const now = new Date();
  //   return this.appointmentsRepository.find({
  //     where: {
  //       appointmentDate: Between(
  //         now,
  //         new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  //       ),
  //       status: AppointmentStatus.CONFIRMED,
  //     },
  //     relations: ['barber', 'customer'],
  //     order: { appointmentDate: 'ASC' },
  //   });
  // }

  async findUpcoming(customerId?: number): Promise<Appointment[]> {
    const now = new Date();
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.barber', 'barber')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .where('appointment.appointmentDate >= :now', { now })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      });

    if (customerId) {
      query.andWhere('appointment.customerId = :customerId', { customerId });
    }

    return query.orderBy('appointment.appointmentDate', 'ASC').getMany();
  }

  async updateStatus(
    id: number,
    status: AppointmentStatus,
    reason?: string,
  ): Promise<Appointment | null> {
    const updateData: any = { status };
    if (reason) {
      updateData.cancellationReason = reason;
    }

    await this.appointmentsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findOne(id: number): Promise<Appointment | null> {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['barber', 'customer', 'payment'],
    });
  }

  async findByBarberAndDate(
    barberId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: {
        barber: { id: barberId },
        appointmentDate: Between(startDate, endDate),
        status: AppointmentStatus.CONFIRMED,
      },
    });
  }

  async addReview(
    id: number,
    rating: number,
    review: string,
  ): Promise<Appointment | null> {
    await this.appointmentsRepository.update(id, { rating, review });
    return this.findOne(id);
  }

  async update(
    id: number,
    data: Partial<Appointment>,
  ): Promise<Appointment | null> {
    await this.appointmentsRepository.update(id, data);
    return this.findOne(id);
  }
}
