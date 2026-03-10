import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create_teams.dto/create_teams.dto';
import { MicrosoftGraphSecurityClientService } from 'src/client/microsoft_graph/microsoft_graph_security.service';
import { getMembersByDepartment } from '../../util/teams-members.helper';
import axios from 'axios';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

@Injectable()
export class MicrosoftTeamsImportService {
  private readonly logger = new Logger(MicrosoftTeamsImportService.name);
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0/teams';

  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) {}

  async createTeam(createTeamDto: CreateTeamDto) {
    const appToken = await this.microsoftGraphClient.getAppToken();

    const requestBody = {
      'template@odata.bind': createTeamDto['template@odata.bind'],
      displayName: createTeamDto.displayName,
      description: createTeamDto.description,
      members: [
        {
          '@odata.type': createTeamDto.member['@odata.type'],
          roles: createTeamDto.member.roles,
          'user@odata.bind': createTeamDto.member['user@odata.bind'],
        },
      ],
    };

    const createResponse = await axios.post(this.graphApiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${appToken}`,
        'Content-Type': 'application/json',
      },
    });

    const location = createResponse.headers['location'];
    const teamId = location?.split('/teams/')[1]?.split('/')[0];

    if (!teamId) {
      throw new Error(`Failed to extract teamId from location: ${location}`);
    }

    this.logger.log(`Team created, teamId=${teamId}. Starting polling...`);

    await this.pollTeamReady(teamId, appToken);

    const members = await getMembersByDepartment(
      this.microsoftGraphClient,
      createTeamDto.department,
    );

    const leaderIdMatch = createTeamDto.member['user@odata.bind'].match(
      /users\('?([^')]+)'?\)/,
    );
    const leaderId = leaderIdMatch?.[1];
    const membersToAdd = members.filter((m) => m.id !== leaderId);

    await Promise.all(
      membersToAdd.map((member) =>
        axios
          .post(
            `${this.graphApiUrl}/${teamId}/members`,
            {
              '@odata.type': '#microsoft.graph.aadUserConversationMember',
              roles: [],
              'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${member.id}')`,
            },
            {
              headers: {
                Authorization: `Bearer ${appToken}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .catch((err) =>
            this.logger.warn(
              `Failed to add member ${member.id} (${member.displayName}): ${err.message}`,
            ),
          ),
      ),
    );

    this.logger.log(
      `Team ${teamId} populated with ${membersToAdd.length} members from department "${createTeamDto.department}"`,
    );

    return { teamId, location };
  }

  private async pollTeamReady(teamId: string, appToken: string): Promise<void> {
    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
      await this.sleep(POLL_INTERVAL_MS);

      try {
        await axios.get(`${this.graphApiUrl}/${teamId}`, {
          headers: { Authorization: `Bearer ${appToken}` },
        });

        this.logger.log(`Team ${teamId} is ready (attempt ${attempt})`);
        return;
      } catch {
        this.logger.debug(`Team ${teamId} not ready yet (attempt ${attempt}/${POLL_MAX_ATTEMPTS})`);
      }
    }

    throw new RequestTimeoutException(
      `Team ${teamId} provisioning timeout after ${POLL_MAX_ATTEMPTS} attempts`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}