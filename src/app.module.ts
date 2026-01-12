import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'path';
import { Environment } from './enums/environment.enum';
import { CustomersModule } from './customers/customers.module';
import { BarbersModule } from './barbers/barbers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(
        __dirname,
        `../.env.${process.env.NODE_ENV?.trim() || Environment.Development}`,
      ),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: +config.get<string>('DB_PORT', '5432'),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASS', 'root'),
        database: config.get<string>('DB_NAME', 'barber_booking'),
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error', 'warn', 'schema'],
      }),
    }),
    CustomersModule,
    BarbersModule,
    AppointmentsModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
