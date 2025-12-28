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
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto/create-team.dto';
import { PaginateTeamDto } from './dto/paginate-team.dto/paginate-team.dto';
import { PatchTeamDto } from './dto/patch-team.dto/patch-team.dto';
import { DeleteTeamDto } from './dto/delete-team.dto/delete-team.dto';
import { GetIdTeamDto } from './dto/id-team.dto/id-team.dtp';

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get()
    async getByIdTeam( 
        @Query() query: GetIdTeamDto,
    ) {
        try { 
            return await this.teamService.GetByIdTeam(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Team by id failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Get('paginate')
    async paginateOrder( 
            @Query() query: PaginateTeamDto,
        ) {
        try { 
            return await this.teamService.PaginateTeam(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Team pagination failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Post()
    async createTeam(@Body() teamDto: CreateTeamDto) {
        try {
            return await this.teamService.CreateTeam(teamDto);
        } catch (error) {
            throw new BadRequestException({
                satusCode: HttpStatus.BAD_REQUEST,
                message: `Team creation failed: ${error.message}`,
                error: "Bad Request"
            })
        }
    }

    @Patch(':id')
    async patchTeam(
        @Param('id') id: string,
        @Body() patchTeamDto: PatchTeamDto
    ) {
        try {
            return await this.teamService.PatchTeam(id, patchTeamDto)
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Team update failed: ${error.message}`,
                else: "Bad Request"
            })
        }
    }

    @Delete(':id')
        async deleteSingleOrder(@Param('id') id: string) {
            try {
                return await this.teamService.DeleteTeam(id);
            } catch (error) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: `Team delete failed: ${error.message}`,
                    error: "Bad Request"
                });
            }
        }
    
    @Delete('batch')
    async deleteMultipleOrders(@Body() deleteOrderDto: DeleteTeamDto) {
        try {
            return await this.teamService.DeleteMultipleTeams(deleteOrderDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Teams delete failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }

}
