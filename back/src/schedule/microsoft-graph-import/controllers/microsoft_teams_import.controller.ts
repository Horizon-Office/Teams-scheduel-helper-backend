import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTeamDto } from './services/dto/create_teams.dto/create_teams.dto';
import { MicrosoftTeamsImportService } from './services/microsoft_teams_import.service';

@Controller('microsoft-graph-teams-import')
export class MicrosoftTeamsImportController {
  constructor(private readonly teamsService: MicrosoftTeamsImportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @Headers('authorization') authToken: string,
  ) {
    const validatedDto = await new Promise<CreateTeamDto>((resolve) => {
      resolve(createTeamDto);
    });
    
    return this.teamsService.createTeam(validatedDto, authToken);
  }
}