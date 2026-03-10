import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTeamDto } from './services/dto/create_teams.dto/create_teams.dto';
import { MicrosoftTeamsImportService } from './services/microsoft_teams_import.service';
import { UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';

@Controller('microsoft-graph-teams-import')
export class MicrosoftTeamsImportController {
  constructor(private readonly teamsService: MicrosoftTeamsImportService) {}

  @Post('team')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.createTeam(createTeamDto);
  }
  
}