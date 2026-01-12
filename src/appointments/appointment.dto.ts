import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  barberId: number;

  @IsString()
  service: string;

  @IsNumber()
  price: number;

  @IsString()
  appointmentDate: Date;

  @IsNumber()
  duration: number;

  @IsString()
  notes?: string;
}
