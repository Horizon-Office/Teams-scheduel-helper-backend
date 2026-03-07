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

@Controller('microsoft-graph-events-import')
export class MicrosoftEventsImportController {
    constructor(
        private readonly microsoftEventsService: MicrosoftEventsImportService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }), new DateValidationPipe())
    async createEvent(
        @Body() createEventDto: CreateEventDto,
        @Headers('Authorization') authorization: string
    ) {
        const accessToken = authorization?.replace('Bearer ', '');
        if (!accessToken) {
            throw new Error('Authorization token is required');
        }
        
    }
}