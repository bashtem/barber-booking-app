import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { Barber } from 'src/barbers/barber.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, customer => customer.appointments)
  customer: Customer;

  @ManyToOne(() => Barber, barber => barber.appointments)
  barber: Barber;

  @Column()
  service: string;

  @Column()
  appointmentDate: Date;

  @Column()
  duration: number; // in minutes

  @Column({
    type: 'simple-enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}