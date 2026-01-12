import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Barber } from './barber.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(Barber)
    private barbersRepository: Repository<Barber>,
  ) {}

  async create(barberData: Partial<Barber>): Promise<Barber> {
    const barber = this.barbersRepository.create(barberData);
    return this.barbersRepository.save(barber);
  }

  async findAll(): Promise<Barber[]> {
    return this.barbersRepository.find({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<Barber | null> {
    return this.barbersRepository.findOne({ where: { id } });
  }

  async getAvailableSlots(barberId: number, date: Date): Promise<string[]> {
    const barber = await this.findOne(barberId);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const workHours = barber?.workingHours.find((wh) => wh.day === dayName);

    if (!workHours) return [];

    const slots: string[] = [];
    const [startH, startM] = workHours.start.split(':').map(Number);
    const [endH, endM] = workHours.end.split(':').map(Number);

    for (let h = startH; h < endH; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return slots;
  }
}
