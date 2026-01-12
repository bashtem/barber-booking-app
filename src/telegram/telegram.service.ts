import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppointmentsService } from 'src/appointments/appointments.service';
import { BarbersService } from 'src/barbers/barbers.service';
import { CustomersService } from 'src/customers/customers.service';
import { AppointmentStatus } from 'src/enums/appointment.enum';
import { Markup, Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private bookingState = new Map();

  constructor(
    private customersService: CustomersService,
    private barbersService: BarbersService,
    private appointmentsService: AppointmentsService,
  ) {
    // Replace with your Telegram Bot Token
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
    this.bot = new Telegraf(BOT_TOKEN);
    this.setupHandlers();
  }

  async onModuleInit() {
    await this.bot.launch();
    console.log('Telegram bot started');
  }

  private setupHandlers() {
    this.bot.start(async (ctx) => {
      const telegramId = ctx.from.id.toString();
      let customer = await this.customersService.findByTelegramId(telegramId);

      if (!customer) {
        await ctx.reply(
          '👋 Welcome to Barber Booking Bot!\n\n' +
            'Please provide your name and phone number:\n' +
            'Format: Name, Phone\n' +
            'Example: John Doe, +1234567890',
        );
      } else {
        await this.showMainMenu(ctx, customer);
      }
    });

    this.bot.on('text', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      let customer = await this.customersService.findByTelegramId(telegramId);

      if (!customer) {
        const text = ctx.message.text;
        const parts = text.split(',').map((p) => p.trim());

        if (parts.length === 2) {
          customer = await this.customersService.create({
            name: parts[0],
            phone: parts[1],
            telegramId: telegramId,
          });
          await ctx.reply(
            `✅ Registration successful! Welcome ${customer.name}`,
          );
          await this.showMainMenu(ctx, customer);
        } else {
          await ctx.reply('Invalid format. Please use: Name, Phone');
        }
        return;
      }

      const state = this.bookingState.get(telegramId);
      if (state?.step === 'notes') {
        state.notes = ctx.message.text;
        await this.completeBooking(ctx, customer, state);
        this.bookingState.delete(telegramId);
      }
    });

    this.bot.action('book_appointment', async (ctx) => {
      await ctx.answerCbQuery();
      const barbers = await this.barbersService.findAll();

      const buttons = barbers.map((b) => [
        Markup.button.callback(
          `👤 ${b.name} - ${b.specialty}`,
          `barber_${b.id}`,
        ),
      ]);

      await ctx.reply('💈 Select a barber:', Markup.inlineKeyboard(buttons));
    });

    this.bot.action(/barber_(\d+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const barberId = parseInt(ctx.match[1]);
      const telegramId = ctx.from.id.toString();

      this.bookingState.set(telegramId, { barberId, step: 'service' });

      const services = ['Haircut', 'Beard Trim', 'Haircut + Beard', 'Styling'];
      const buttons = services.map((s) => [
        Markup.button.callback(s, `service_${s}`),
      ]);

      await ctx.reply('✂️ Select a service:', Markup.inlineKeyboard(buttons));
    });

    this.bot.action(/service_(.+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const service = ctx.match[1];
      const telegramId = ctx.from.id.toString();
      const state = this.bookingState.get(telegramId);

      state.service = service;
      state.step = 'date';

      const dates = this.getNextDays(7);
      const buttons = dates.map((d) => [
        Markup.button.callback(d.label, `date_${d.value}`),
      ]);

      await ctx.reply('📅 Select a date:', Markup.inlineKeyboard(buttons));
    });

    this.bot.action(/date_(.+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const date = ctx.match[1];
      const telegramId = ctx.from.id.toString();
      const state = this.bookingState.get(telegramId);

      state.date = date;
      const barberId = state.barberId;
      const slots = await this.barbersService.getAvailableSlots(
        barberId,
        new Date(date),
      );

      const buttons = slots.map((s) => [
        Markup.button.callback(s, `time_${s}`),
      ]);

      await ctx.reply('🕐 Select a time:', Markup.inlineKeyboard(buttons));
    });

    this.bot.action(/time_(.+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const time = ctx.match[1];
      const telegramId = ctx.from.id.toString();
      const state = this.bookingState.get(telegramId);

      state.time = time;
      state.step = 'notes';

      await ctx.reply(
        '📝 Add any notes or type "skip" to continue:',
        Markup.inlineKeyboard([[Markup.button.callback('Skip', 'skip_notes')]]),
      );
    });

    this.bot.action('skip_notes', async (ctx) => {
      await ctx.answerCbQuery();
      const telegramId = ctx.from.id.toString();
      const customer = await this.customersService.findByTelegramId(telegramId);
      const state = this.bookingState.get(telegramId);

      await this.completeBooking(ctx, customer, state);
      this.bookingState.delete(telegramId);
    });

    this.bot.action('my_appointments', async (ctx) => {
      await ctx.answerCbQuery();
      const telegramId = ctx.from.id.toString();
      const customer = await this.customersService.findByTelegramId(telegramId);
      if (!customer) {
        await ctx.reply('Please register first by sending /start command.');
        return;
      }
      const appointments = await this.appointmentsService.findByCustomer(
        customer.id,
      );

      if (appointments.length === 0) {
        await ctx.reply('You have no appointments.');
        return;
      }

      let message = '📋 Your Appointments:\n\n';
      appointments.forEach((apt) => {
        const date = new Date(apt.appointmentDate);
        message += `ID: ${apt.id}\n`;
        message += `Barber: ${apt.barber.name}\n`;
        message += `Service: ${apt.service}\n`;
        message += `Date: ${date.toLocaleDateString()}\n`;
        message += `Time: ${date.toLocaleTimeString()}\n`;
        message += `Status: ${apt.status}\n\n`;
      });

      await ctx.reply(message);
    });
  }

  private async showMainMenu(ctx: any, customer: any) {
    await ctx.reply(
      `👋 Hello ${customer.name}!\n\nWhat would you like to do?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 Book Appointment', 'book_appointment')],
        [Markup.button.callback('📋 My Appointments', 'my_appointments')],
      ]),
    );
  }

  private async completeBooking(ctx: any, customer: any, state: any) {
    const barber = await this.barbersService.findOne(state.barberId);
    if (!barber) {
      await ctx.reply(
        '❌ Selected barber not found. Please try booking again.',
      );
      return;
    }
    const [hours, minutes] = state.time.split(':');
    const appointmentDate = new Date(state.date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));

    const appointment = await this.appointmentsService.create({
      customer,
      barber,
      service: state.service,
      appointmentDate,
      duration: 30,
      status: AppointmentStatus.PENDING,
      notes: state.notes || '',
    });

    await ctx.reply(
      `✅ Appointment Booked!\n\n` +
        `📋 ID: ${appointment.id}\n` +
        `👤 Barber: ${barber.name}\n` +
        `✂️ Service: ${state.service}\n` +
        `📅 Date: ${appointmentDate.toLocaleDateString()}\n` +
        `🕐 Time: ${state.time}\n` +
        `📝 Status: Pending confirmation\n\n` +
        `You will receive a confirmation soon!`,
    );
  }

  private getNextDays(count: number): Array<{ label: string; value: string }> {
    const days: Array<{ label: string; value: string }> = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        value: date.toISOString().split('T')[0],
      });
    }

    return days;
  }

  async sendConfirmation(appointment: any) {
    if (appointment.customer.telegramId) {
      await this.bot.telegram.sendMessage(
        appointment.customer.telegramId,
        `✅ Your appointment has been confirmed!\n\n` +
          `Barber: ${appointment.barber.name}\n` +
          `Date: ${new Date(appointment.appointmentDate).toLocaleString()}\n` +
          `Service: ${appointment.service}`,
      );
    }
  }

  async sendReminder(appointment: any) {
    if (appointment.customer.telegramId) {
      await this.bot.telegram.sendMessage(
        appointment.customer.telegramId,
        `⏰ Reminder: You have an appointment tomorrow!\n\n` +
          `Barber: ${appointment.barber.name}\n` +
          `Date: ${new Date(appointment.appointmentDate).toLocaleString()}\n` +
          `Service: ${appointment.service}`,
      );
    }
  }
}
