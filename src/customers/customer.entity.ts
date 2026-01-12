import { Appointment } from 'src/appointments/appointment.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Appointment, appointment => appointment.customer)
  appointments: Appointment[];
}