import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Barber } from 'src/barbers/barber.entity';
import { AvailabilityType } from 'src/enums/availability.enum';

@Entity()
export class BarberAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Barber, (barber) => barber.availability)
  barber: Barber;

  @Column({
    type: 'simple-enum',
    enum: AvailabilityType,
    default: AvailabilityType.REGULAR,
  })
  type: AvailabilityType;

  @Column({ nullable: true })
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ type: 'date', nullable: true })
  specificDate: Date;

  @Column()
  startTime: string; // HH:MM format

  @Column()
  endTime: string; // HH:MM format

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  reason: string;
}
