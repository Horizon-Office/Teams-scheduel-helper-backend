import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create_teams.dto/create_teams.dto';
import axios from 'axios';

@Injectable()
export class MicrosoftTeamsImportService {
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0/teams';

  async createTeam(createTeamDto: CreateTeamDto, authToken: string) {
    const requestBody = {
      'template@odata.bind': createTeamDto['template@odata.bind'],
      displayName: createTeamDto.displayName,
      description: createTeamDto.description,
      members: createTeamDto.members.map(member => ({
        '@odata.type': member['@odata.type'],
        roles: member.roles,
        'user@odata.bind': member['user@odata.bind']
      }))
    };

    const headers = {
      'Authorization': authToken,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(this.graphApiUrl, requestBody, { headers });
    return response.data;
  }
}