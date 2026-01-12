import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;
  
  @IsString()
  password: string;
}
