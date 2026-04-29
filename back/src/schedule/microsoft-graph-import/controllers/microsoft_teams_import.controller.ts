import { Body, Controller, Post } from '@nestjs/common';
import { MicrosoftTeamsImportService } from './services/microsoft_teams_import.service';

export type Group = {
    displayName: string,
    departments: string[],
    description: string,
    owner: {
        name: string;
        id: string;
    };
}

@Controller('microsoft-graph-teams-import')
export class MicrosoftTeamsImportController {
    constructor(
        private readonly teamsImportService: MicrosoftTeamsImportService,
    ) { }

    @Post('create-teams')
    async createTeams(
        @Body('groups') groups: Group[],
    ): Promise<any> {
        if (!groups) {
            return {
                success: false,
                message: 'At least one of "teams" or "departments" is required',
            };
        }

        return this.teamsImportService.createTeams(groups || []);
    }
}   