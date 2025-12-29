import { 
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    HttpCode, 
    UseGuards,
    Query,
    Param,
    HttpStatus,
    BadRequestException,
    Body,
 } from '@nestjs/common';
import { TeamEventService } from './team_event.service';
import { CreateEventDto } from './dto/create-event.dto/create-event.dto';
import { PaginateEventDto } from './dto/paginate-event.dto/paginate-event.dto';
import { PatchEventDto } from './dto/patch-event.dto/patch-event.dto';
import { DeleteEventDto } from './dto/delete-event.dto/delete-event.dto';
import { GetIdEventDto } from './dto/id-event.dto/id-event.dtp';

@Controller('event')
export class TeamEventController {
    constructor(private readonly eventService: TeamEventService) {}

    @Get()
    async getByIdEvent( 
        @Query() query: GetIdEventDto,
    ) {
        try { 
            return await this.eventService.GetByIdEvent(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Event by id failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Get('paginate')
    async paginateEvent( 
            @Query() query: PaginateEventDto,
        ) {
        try { 
            return await this.eventService.PaginateEvent(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Event pagination failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Post()
    async createEvent(@Body() eventDto: CreateEventDto) {
        try {
            return await this.eventService.CreateEvent(eventDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Event creation failed: ${error.message}`,
                error: "Bad Request"
            })
        }
    }

    @Patch(':id')
    async patchEvent(
        @Param('id') id: string,
        @Body() patchEventDto: PatchEventDto
    ) {
        try {
            return await this.eventService.PatchEvent(id, patchEventDto)
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Event update failed: ${error.message}`,
                error: "Bad Request"
            })
        }
    }

    @Delete(':id')
        async deleteSingleEvent(@Param('id') id: string) {
            try {
                return await this.eventService.DeleteEvent(id);
            } catch (error) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: `Event delete failed: ${error.message}`,
                    error: "Bad Request"
                });
            }
        }
    
    @Delete('batch')
    async deleteMultipleEvents(@Body() deleteEventDto: DeleteEventDto) {
        try {
            return await this.eventService.DeleteMultipleEvents(deleteEventDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Events delete failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }
}