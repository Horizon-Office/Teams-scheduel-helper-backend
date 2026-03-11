import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTeamDto } from './dto/create_teams.dto/create_teams.dto';
import { MicrosoftGraphSecurityClientService } from 'src/client/microsoft_graph/microsoft_graph_security.service';
import { getMembersByDepartment } from '../../util/teams-members.helper';
import axios from 'axios';

const POLL_INTERVAL_MS  = 3000;
const POLL_MAX_ATTEMPTS = 20;

// --- mailNickname helpers ---

const TRANSLIT_MAP: Record<string, string> = {
  а: 'a',  б: 'b',  в: 'v',  г: 'h',  ґ: 'g',  д: 'd',  е: 'e',  є: 'ye',
  ж: 'zh', з: 'z',  и: 'y',  і: 'i',  ї: 'yi', й: 'y',  к: 'k',  л: 'l',
  м: 'm',  н: 'n',  о: 'o',  п: 'p',  р: 'r',  с: 's',  т: 't',  у: 'u',
  ф: 'f',  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu',
  я: 'ya', ё: 'yo', э: 'e',  ъ: '',
};

const transliterate = (str: string): string =>
  str
    .split('')
    .map(ch => {
      const lower  = ch.toLowerCase();
      const mapped = TRANSLIT_MAP[lower];
      if (mapped === undefined) return ch;
      return ch !== lower && mapped.length > 0
        ? mapped[0].toUpperCase() + mapped.slice(1)
        : mapped;
    })
    .join('');

/**
 * Генерирует уникальный mailNickname для MS Graph Teams.
 *
 * Формат: <транслит-displayName-до-40-символов>-<8-hex-символов>
 * Пример: "121-22-1-Analiz-bezpeky-a3f9c12b"
 *
 * Суффикс UUID гарантирует уникальность — MS Graph вернёт
 * UnableToGenerateValidTeamAlias если nickname уже занят в тенанте.
 */
const generateMailNickname = (displayName: string): string => {
  const base = transliterate(displayName)
    .replace(/[^a-zA-Z0-9-]/g, '-')  // кириллица/спецсимволы → дефис
    .replace(/-+/g, '-')             // схлопываем повторы
    .replace(/^-|-$/g, '')           // убираем крайние дефисы
    .slice(0, 40);                   // оставляем место для суффикса

  const suffix = randomUUID().replace(/-/g, '').slice(0, 8); // 8 hex-символов

  return `${base}-${suffix}`.replace(/^-/, ''); // страховка если base пуст
};

@Injectable()
export class MicrosoftTeamsImportService {
  private readonly logger      = new Logger(MicrosoftTeamsImportService.name);
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0/teams';

  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) {}

  async createTeam(createTeamDto: CreateTeamDto) {
    const appToken = await this.microsoftGraphClient.getAppToken();

    const mailNickname = createTeamDto.mailNickname ?? generateMailNickname(createTeamDto.displayName);
    this.logger.debug(`Generated mailNickname: "${mailNickname}" for team "${createTeamDto.displayName}"`);

    const requestBody = {
      'template@odata.bind': createTeamDto['template@odata.bind'],
      displayName:           createTeamDto.displayName,
      description:           createTeamDto.description,
      mailNickname,                                           // 👈 гарантированно уникальный ASCII-nickname
      members: [
        {
          '@odata.type':     createTeamDto.member['@odata.type'],
          roles:             createTeamDto.member.roles,
          'user@odata.bind': createTeamDto.member['user@odata.bind'],
        },
      ],
    };

    const createResponse = await axios.post(this.graphApiUrl, requestBody, {
      headers: {
        Authorization:  `Bearer ${appToken}`,
        'Content-Type': 'application/json',
      },
    });

    const location    = createResponse.headers['location'];
    const teamIdMatch = location?.match(/teams\('([^']+)'\)/);
    const teamId      = teamIdMatch?.[1];

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
    const leaderId    = leaderIdMatch?.[1];
    const membersToAdd = members.filter((m) => m.id !== leaderId);

    await Promise.all(
      membersToAdd.map((member) =>
        axios
          .post(
            `${this.graphApiUrl}/${teamId}/members`,
            {
              '@odata.type':     '#microsoft.graph.aadUserConversationMember',
              roles:             [],
              'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${member.id}')`,
            },
            {
              headers: {
                Authorization:  `Bearer ${appToken}`,
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
        this.logger.debug(
          `Team ${teamId} not ready yet (attempt ${attempt}/${POLL_MAX_ATTEMPTS})`,
        );
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
