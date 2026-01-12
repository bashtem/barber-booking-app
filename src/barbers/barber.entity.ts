import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from 'src/customers/customer.entity';
import { BarberAvailability } from 'src/availability/availability.entity';

@Entity()
export class Barber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'simple-json', nullable: true })
  workingHours: {
    day: string;
    start: string;
    end: string;
  }[];

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ type: 'simple-json', nullable: true })
  services: {
    name: string;
    duration: number;
    price: number;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Customer, { nullable: true })
  user: Customer;

  @OneToMany(() => Appointment, (appointment) => appointment.barber)
  appointments: Appointment[];

  @OneToMany(() => BarberAvailability, (availability) => availability.barber)
  availability: BarberAvailability[];
}