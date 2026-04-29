import { Injectable } from '@nestjs/common';
import { MicrosoftGraphSecurityClientService } from 'src/client/microsoft_graph/microsoft_graph_security.service';
import { Group } from '../microsoft_teams_import.controller';

type AddDepartmentMembersResult = Awaited<
  ReturnType<MicrosoftGraphSecurityClientService['addDepartmentMembersToTeam']>
>;

type CreateTeamResult = Awaited<
  ReturnType<MicrosoftGraphSecurityClientService['createTeam']>
>;

type TeamImportStatus = 'created_and_filled' | 'failed';

type TeamImportResult = {
  displayName: string;
  departments: string[];
  description: string;
  owner: {
    name: string;
    id: string;
  };
  status: TeamImportStatus;
  createdTeam?: CreateTeamResult;
  membersResult?: AddDepartmentMembersResult;
  error?: string;
};

type TeamsImportResult = {
  success: boolean;
  totalGroups: number;
  totalSucceeded: number;
  totalFailed: number;
  results: TeamImportResult[];
};

@Injectable()
export class MicrosoftTeamsImportService {
  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) { }

  /**
   * Create Microsoft Teams and fill them with department members
   *
   * Runs team provisioning with limited concurrency.
   * Each worker processes one group sequentially:
   * create team -> get teamId -> add department members.
   *
   * @param groups Groups with team name, description, owner and departments
   * @returns Import result for all processed groups
   */
  async createTeams(groups: Group[]): Promise<TeamsImportResult> {
    const teamConcurrency = 2;

    const results = await this.mapWithConcurrency(
      groups,
      teamConcurrency,
      async (group) => this.createTeamAndFillMembers(group),
    );

    const totalSucceeded = results.filter(
      (result) => result.status === 'created_and_filled',
    ).length;

    const totalFailed = results.filter(
      (result) => result.status === 'failed',
    ).length;

    return {
      success: totalFailed === 0,
      totalGroups: groups.length,
      totalSucceeded,
      totalFailed,
      results,
    };
  }

  /**
   * Create one team and fill it with users from the provided departments
   *
   * @param group Group data used for team creation and member import
   * @returns Result for one group processing operation
   */
  private async createTeamAndFillMembers(
    group: Group,
  ): Promise<TeamImportResult> {
    try {
      if (!group.owner?.id) {
        throw new Error('Group owner is missing');
      }

      if (!group.departments?.length) {
        throw new Error('Group departments are missing');
      }

      const createdTeam = await this.microsoftGraphClient.createTeam(
        group.displayName,
        group.owner.id,
        group.description,
      );

      const membersResult =
        await this.microsoftGraphClient.addDepartmentMembersToTeam(
          group.departments,
          createdTeam.teamId,
        );

      return {
        displayName: group.displayName,
        departments: group.departments,
        description: group.description,
        owner: group.owner,
        status: 'created_and_filled',
        createdTeam,
        membersResult,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown team import error';

      return {
        displayName: group.displayName,
        departments: group.departments ?? [],
        description: group.description,
        owner: group.owner,
        status: 'failed',
        error: message,
      };
    }
  }

  /**
   * Execute async operations with limited concurrency
   *
   * @param items Items to process
   * @param concurrency Maximum number of parallel workers
   * @param mapper Async handler for each item
   * @returns Ordered list of operation results
   */
  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = [];
    let currentIndex = 0;

    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      async () => {
        while (currentIndex < items.length) {
          const index = currentIndex++;
          results[index] = await mapper(items[index], index);
        }
      },
    );

    await Promise.all(workers);

    return results;
  }
}