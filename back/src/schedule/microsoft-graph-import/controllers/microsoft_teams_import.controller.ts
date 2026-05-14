import { Body, Controller, Post } from '@nestjs/common';
import { MicrosoftTeamsImportService } from './services/microsoft_teams_import.service';
import { CreateTeamsDto } from './services/dto/create_teams.dto/create_teams.dto'; // Импортируем твой новый DTO

@Controller('microsoft-graph-teams-import')
export class MicrosoftTeamsImportController {
  constructor(
    private readonly teamsImportService: MicrosoftTeamsImportService,
  ) {}

  @Post('create-teams')
  async createTeams(
    @Body() createTeamsDto: CreateTeamsDto, 
  ): Promise<any> {
    return this.teamsImportService.createTeams(createTeamsDto.groups);
  }
}