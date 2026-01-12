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

  async findAll(filters?: {
    specialty?: string;
    minRating?: number;
  }): Promise<Barber[]> {
    const query = this.barbersRepository
      .createQueryBuilder('barber')
      .where('barber.isActive = :isActive', { isActive: true });

    if (filters?.specialty) {
      query.andWhere('barber.specialty = :specialty', {
        specialty: filters.specialty,
      });
    }

    if (filters?.minRating) {
      query.andWhere('barber.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Barber | null> {
    return this.barbersRepository.findOne({ where: { id }, relations: ['availability'] });
  }

  async update(id: number, data: Partial<Barber>): Promise<Barber | null> {
    await this.barbersRepository.update(id, data);
    return this.findOne(id);
  }

  async updateRating(barberId: number, newRating: number) {
    const barber = await this.findOne(barberId);
    if (!barber) return;
    const totalReviews = barber.totalReviews + 1;
    const rating = ((barber.rating * barber.totalReviews) + newRating) / totalReviews;
    
    await this.update(barberId, {
      rating: parseFloat(rating.toFixed(2)),
      totalReviews,
    });
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
