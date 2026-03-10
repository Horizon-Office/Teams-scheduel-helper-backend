import { 
    Controller,
    Post,
    Body,
    UsePipes,
    ValidationPipe,
    HttpCode,
    HttpStatus,
    Headers
} from '@nestjs/common';
import { MicrosoftEventsImportService } from './services/microsoft_events_import.service';
import { CreateEventDto } from './services/dto/create_event.dto/create_event.dto';
import { DateValidationPipe } from '../../../pipes/date-validation.pipe';
import { BadRequestException } from '@nestjs/common';

@Controller('microsoft-graph-events-import')
export class MicrosoftEventsImportController {
    constructor(
        private readonly microsoftEventsService: MicrosoftEventsImportService
    ) {}

    @Post('event')
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createEvent(@Body() createEventDto: CreateEventDto) {
        return this.microsoftEventsService.createEvent(
            createEventDto,
            createEventDto.teacherId
        );
    }
    
}