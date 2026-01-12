import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Barber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ type: 'simple-json', nullable: true })
  workingHours: {
    day: string;
    start: string;
    end: string;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Appointment, appointment => appointment.barber)
  appointments: Appointment[];
}