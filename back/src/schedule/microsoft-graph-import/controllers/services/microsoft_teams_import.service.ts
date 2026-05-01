import { Injectable } from '@nestjs/common';
import { MicrosoftGraphSecurityClientService } from 'src/client/microsoft_graph/microsoft_graph_security.service';
import { Group } from '../microsoft_teams_import.controller';

type TeamsImportGroupStatus =
  | 'succeeded'
  | 'partially_succeeded'
  | 'failed'
  | 'timed_out';

interface TeamImportGroupResult {
  index: number;

  displayName: string;
  description: string;
  ownerName: string;
  ownerId: string;
  departments: string[];

  status: TeamsImportGroupStatus;

  teamId?: string;
  operationUrl?: string;

  totalUsers: number;
  totalAdded: number;
  totalFailed: number;

  error?: string;
  failedUsers?: any[];
}

interface TeamsImportResult {
  success: boolean;

  totalGroups: number;
  totalSucceeded: number;
  totalPartiallySucceeded: number;
  totalFailed: number;
  totalTimedOut: number;

  totalCreatedTeams: number;
  totalAddedMembers: number;
  totalFailedMembers: number;

  results: TeamImportGroupResult[];
}

interface StartedTeamItem {
  index: number;
  group: Group;
  departments: string[];
  operationUrl?: string;
  teamId?: string;
}

@Injectable()
export class MicrosoftTeamsImportService {
  private readonly TEAM_START_CONCURRENCY = 50;
  private readonly TEAM_OPERATION_POLL_CONCURRENCY = 10;
  private readonly TEAM_FILL_CONCURRENCY = 5;

  private readonly POLL_DELAY_MS = 15_000;
  private readonly MAX_POLL_ATTEMPTS = 44;

  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) { }

  /**
   * Create Microsoft Teams and fill them with department members.
   *
   * Flow:
   * 1. Start creation for many teams.
   * 2. Poll all pending operations.
   * 3. Fill each team after its operation succeeds.
   *
   * @param groups Groups with team name, description, owner and departments
   * @returns Import result for all processed groups
   */
  async createTeams(groups: Group[]): Promise<TeamsImportResult> {
    const results = new Array<TeamImportGroupResult>(groups.length);

    if (!groups.length) {
      return this.buildSummary([]);
    }

    const startedItems = await this.runWithConcurrency(
      groups,
      this.TEAM_START_CONCURRENCY,
      async (group, index) => this.startTeamCreation(group, index, results),
    );

    const pendingItems = startedItems.filter(
      (item): item is StartedTeamItem => Boolean(item?.operationUrl),
    );

    const alreadyCreatedItems = startedItems.filter(
      (item): item is StartedTeamItem => Boolean(item?.teamId),
    );

    await this.fillCreatedTeams(alreadyCreatedItems, results);

    await this.pollPendingTeamsAndFill(pendingItems, results);

    return this.buildSummary(results);
  }

  private async startTeamCreation(
    group: Group,
    index: number,
    results: TeamImportGroupResult[],
  ): Promise<StartedTeamItem | null> {
    const departments = this.normalizeDepartments(group.departments);

    try {
      const started = await this.microsoftGraphClient.startTeamCreation(
        group.displayName,
        group.owner.id,
        group.description,
      );

      const item: StartedTeamItem = {
        index,
        group,
        departments,
        operationUrl: started.operationUrl,
        teamId: started.teamId,
      };

      return item;
    } catch (error: any) {
      results[index] = this.createFailedResult(
        group,
        index,
        departments,
        this.getErrorMessage(error),
      );

      return null;
    }
  }

  private async pollPendingTeamsAndFill(
    pendingItems: StartedTeamItem[],
    results: TeamImportGroupResult[],
  ): Promise<void> {
    let pending = [...pendingItems];

    for (
      let attempt = 1;
      attempt <= this.MAX_POLL_ATTEMPTS && pending.length > 0;
      attempt++
    ) {
      await this.delay(this.POLL_DELAY_MS);

      const checkedItems = await this.runWithConcurrency(
        pending,
        this.TEAM_OPERATION_POLL_CONCURRENCY,
        async (item) => this.checkTeamOperation(item, results),
      );

      const succeededItems = checkedItems.filter(
        (item): item is StartedTeamItem => Boolean(item?.teamId),
      );

      pending = checkedItems.filter(
        (item): item is StartedTeamItem =>
          Boolean(item?.operationUrl) && !item?.teamId,
      );

      await this.fillCreatedTeams(succeededItems, results);
    }

    for (const item of pending) {
      results[item.index] = {
        ...this.createBaseResult(item.group, item.index, item.departments),
        status: 'timed_out',
        operationUrl: item.operationUrl,
        error: 'Team creation polling timed out',
      };
    }
  }

  private async checkTeamOperation(
    item: StartedTeamItem,
    results: TeamImportGroupResult[],
  ): Promise<StartedTeamItem | null> {
    if (!item.operationUrl) {
      return item;
    }

    try {
      const operation =
        await this.microsoftGraphClient.getTeamCreationOperation(
          item.operationUrl,
        );

      if (operation.status === 'succeeded') {
        if (!operation.targetResourceId) {
          results[item.index] = {
            ...this.createBaseResult(item.group, item.index, item.departments),
            status: 'failed',
            operationUrl: item.operationUrl,
            error: 'Team creation succeeded but targetResourceId is missing',
          };

          return null;
        }

        return {
          ...item,
          teamId: operation.targetResourceId,
        };
      }

      if (operation.status === 'failed') {
        results[item.index] = {
          ...this.createBaseResult(item.group, item.index, item.departments),
          status: 'failed',
          operationUrl: item.operationUrl,
          error: `Team provisioning failed: ${JSON.stringify(operation.error)}`,
        };

        return null;
      }

      return item;
    } catch (error: any) {
      results[item.index] = {
        ...this.createBaseResult(item.group, item.index, item.departments),
        status: 'failed',
        operationUrl: item.operationUrl,
        error: this.getErrorMessage(error),
      };

      return null;
    }
  }

  private async fillCreatedTeams(
    items: StartedTeamItem[],
    results: TeamImportGroupResult[],
  ): Promise<void> {
    await this.runWithConcurrency(
      items,
      this.TEAM_FILL_CONCURRENCY,
      async (item) => {
        if (!item.teamId) {
          return;
        }

        results[item.index] = await this.fillCreatedTeam(item);
      },
    );
  }

  private async fillCreatedTeam(
    item: StartedTeamItem,
  ): Promise<TeamImportGroupResult> {
    const baseResult = this.createBaseResult(
      item.group,
      item.index,
      item.departments,
    );

    if (!item.teamId) {
      return {
        ...baseResult,
        status: 'failed',
        operationUrl: item.operationUrl,
        error: 'teamId is missing',
      };
    }

    try {
      const addMembersResult =
        await this.microsoftGraphClient.addDepartmentMembersToTeam(
          item.departments,
          item.teamId,
        );

      const hasMemberErrors = addMembersResult.totalFailed > 0;

      return {
        ...baseResult,
        status: hasMemberErrors ? 'partially_succeeded' : 'succeeded',

        teamId: item.teamId,
        operationUrl: item.operationUrl,

        totalUsers: addMembersResult.totalUsers,
        totalAdded: addMembersResult.totalAdded,
        totalFailed: addMembersResult.totalFailed,

        failedUsers: addMembersResult.failedUsers,
      };
    } catch (error: any) {
      return {
        ...baseResult,
        status: 'failed',
        teamId: item.teamId,
        operationUrl: item.operationUrl,
        error: this.getErrorMessage(error),
      };
    }
  }

  private createBaseResult(
    group: Group,
    index: number,
    departments: string[],
  ): TeamImportGroupResult {
    return {
      index,

      displayName: group.displayName,
      description: group.description,
      ownerName: group.owner.name,
      ownerId: group.owner.id,
      departments,

      status: 'failed',

      totalUsers: 0,
      totalAdded: 0,
      totalFailed: 0,
    };
  }

  private createFailedResult(
    group: Group,
    index: number,
    departments: string[],
    error: string,
  ): TeamImportGroupResult {
    return {
      ...this.createBaseResult(group, index, departments),
      status: 'failed',
      error,
    };
  }

  private buildSummary(results: TeamImportGroupResult[]): TeamsImportResult {
    const completedResults = results.filter(Boolean);

    const totalSucceeded = completedResults.filter(
      (result) => result.status === 'succeeded',
    ).length;

    const totalPartiallySucceeded = completedResults.filter(
      (result) => result.status === 'partially_succeeded',
    ).length;

    const totalTimedOut = completedResults.filter(
      (result) => result.status === 'timed_out',
    ).length;

    const totalFailed = completedResults.filter(
      (result) => result.status === 'failed',
    ).length;

    const totalCreatedTeams = completedResults.filter(
      (result) => Boolean(result.teamId),
    ).length;

    const totalAddedMembers = completedResults.reduce(
      (sum, result) => sum + result.totalAdded,
      0,
    );

    const totalFailedMembers = completedResults.reduce(
      (sum, result) => sum + result.totalFailed,
      0,
    );

    return {
      success:
        totalFailed === 0 &&
        totalTimedOut === 0 &&
        totalPartiallySucceeded === 0,

      totalGroups: completedResults.length,
      totalSucceeded,
      totalPartiallySucceeded,
      totalFailed,
      totalTimedOut,

      totalCreatedTeams,
      totalAddedMembers,
      totalFailedMembers,

      results: completedResults,
    };
  }

  private async runWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    handler: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let currentIndex = 0;

    const workersCount = Math.min(concurrency, items.length);

    const workers = Array.from({ length: workersCount }, async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        results[index] = await handler(items[index], index);
      }
    });

    await Promise.all(workers);

    return results;
  }

  private normalizeDepartments(departments: string[]): string[] {
    return departments.map((department) => department.trim()).filter(Boolean);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }

    return JSON.stringify(error);
  }
}