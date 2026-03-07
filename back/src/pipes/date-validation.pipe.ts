import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

interface PipeValue {
  startTime?: string;
  endTime?: string;
  startDateRange?: string;
  endDateRange?: string;
}

@Injectable()
export class DateValidationPipe implements PipeTransform {
  private readonly TIME_REGEX = /^\d{2}:\d{2}$/;
  private readonly DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  transform(value: unknown): PipeValue {
    const typedValue = value as PipeValue;

    if (typedValue.startTime) {
      this.validateTime(typedValue.startTime, 'startTime');
    }

    if (typedValue.endTime) {
      this.validateTime(typedValue.endTime, 'endTime');
    }

    if (typedValue.startDateRange) {
      this.validateDate(typedValue.startDateRange, 'startDateRange');
    }

    if (typedValue.endDateRange) {
      this.validateDate(typedValue.endDateRange, 'endDateRange');
    }

    if (typedValue.startTime && typedValue.endTime && typedValue.endTime <= typedValue.startTime) {
      throw new BadRequestException('endTime must be later than startTime');
    }

    if (typedValue.startDateRange && typedValue.endDateRange && typedValue.endDateRange <= typedValue.startDateRange) {
      throw new BadRequestException('endDateRange must be later than startDateRange');
    }

    return typedValue;
  }

  private validateTime(time: string, field: string): void {
    if (!this.TIME_REGEX.test(time)) {
      throw new BadRequestException(`Invalid ${field} format. Expected HH:mm`);
    }
    const [hours, minutes] = time.split(':').map(Number);
    if (hours > 23 || minutes > 59) {
      throw new BadRequestException(`Invalid ${field} value`);
    }
  }

  private validateDate(date: string, field: string): void {
    if (!this.DATE_REGEX.test(date)) {
      throw new BadRequestException(`Invalid ${field} format. Expected YYYY-MM-DD`);
    }
    const [, month, day] = date.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new BadRequestException(`Invalid ${field} value`);
    }
  }
}