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

interface StartBatchItem {
  index: number;
  group: Group;
}

@Injectable()
export class MicrosoftTeamsImportService {
  private readonly START_BATCH_SIZE = 10;
  private readonly START_BATCH_INTERVAL_MS = 1_000;

  private readonly FIRST_POLL_DELAY_MS = 15_000;
  private readonly POLL_DELAY_MS = 15_000;
  private readonly MAX_POLL_ATTEMPTS = 44;

  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) {}

  /**
   * Create Microsoft Teams and fill them with department members.
   *
   * Flow:
   * 1. Split groups into batches by 10.
   * 2. Start one batch every second.
   * 3. Each team lifecycle runs independently:
   *    start creation -> wait -> poll -> fill members.
   *
   * @param groups Groups with team name, description, owner and departments
   * @returns Import result for all processed groups
   */
  async createTeams(groups: Group[]): Promise<TeamsImportResult> {
    const results = new Array<TeamImportGroupResult>(groups.length);

    if (!groups.length) {
      return this.buildSummary([]);
    }

    const batches = this.createStartBatches(groups, this.START_BATCH_SIZE);

    const batchTasks = batches.map((batch, batchIndex) =>
      this.scheduleStartBatch(batch, batchIndex, results),
    );

    await Promise.all(batchTasks);

    return this.buildSummary(results);
  }

  private createStartBatches(
    groups: Group[],
    batchSize: number,
  ): StartBatchItem[][] {
    const batches: StartBatchItem[][] = [];

    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize).map((group, localIndex) => ({
        group,
        index: i + localIndex,
      }));

      batches.push(batch);
    }

    return batches;
  }

  private scheduleStartBatch(
    batch: StartBatchItem[],
    batchIndex: number,
    results: TeamImportGroupResult[],
  ): Promise<void> {
    const delayMs = batchIndex * this.START_BATCH_INTERVAL_MS;

    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = batch.map(({ group, index }) =>
          this.processTeamLifecycle(group, index, results),
        );

        Promise.all(tasks)
          .then(() => resolve())
          .catch((error: any) => {
            for (const { group, index } of batch) {
              if (results[index]) {
                continue;
              }

              const departments = this.normalizeDepartments(group.departments);

              results[index] = this.createFailedResult(
                group,
                index,
                departments,
                this.getErrorMessage(error),
              );
            }

            resolve();
          });
      }, delayMs);
    });
  }

  private async processTeamLifecycle(
    group: Group,
    index: number,
    results: TeamImportGroupResult[],
  ): Promise<void> {
    const departments = this.normalizeDepartments(group.departments);

    try {
      const started = await this.microsoftGraphClient.startTeamCreation(
        group.displayName,
        group.owner.id,
        group.description,
      );

      if (started.status === 'created' && started.teamId) {
        results[index] = await this.fillCreatedTeam({
          index,
          group,
          departments,
          teamId: started.teamId,
        });

        return;
      }

      if (!started.operationUrl) {
        results[index] = {
          ...this.createBaseResult(group, index, departments),
          status: 'failed',
          error: 'Team creation operation URL is missing',
        };

        return;
      }

      await this.delay(this.FIRST_POLL_DELAY_MS);

      results[index] = await this.pollAndFillTeam({
        index,
        group,
        departments,
        operationUrl: started.operationUrl,
      });
    } catch (error: any) {
      results[index] = this.createFailedResult(
        group,
        index,
        departments,
        this.getErrorMessage(error),
      );
    }
  }

  private async pollAndFillTeam(
    item: StartedTeamItem,
  ): Promise<TeamImportGroupResult> {
    if (!item.operationUrl) {
      return {
        ...this.createBaseResult(item.group, item.index, item.departments),
        status: 'failed',
        error: 'operationUrl is missing',
      };
    }

    for (let attempt = 1; attempt <= this.MAX_POLL_ATTEMPTS; attempt++) {
      try {
        const operation =
          await this.microsoftGraphClient.getTeamCreationOperation(
            item.operationUrl,
          );

        if (operation.status === 'succeeded') {
          if (!operation.targetResourceId) {
            return {
              ...this.createBaseResult(item.group, item.index, item.departments),
              status: 'failed',
              operationUrl: item.operationUrl,
              error: 'Team creation succeeded but targetResourceId is missing',
            };
          }

          return this.fillCreatedTeam({
            ...item,
            teamId: operation.targetResourceId,
          });
        }

        if (operation.status === 'failed') {
          return {
            ...this.createBaseResult(item.group, item.index, item.departments),
            status: 'failed',
            operationUrl: item.operationUrl,
            error: `Team provisioning failed: ${JSON.stringify(operation.error)}`,
          };
        }

        if (attempt < this.MAX_POLL_ATTEMPTS) {
          await this.delay(this.POLL_DELAY_MS);
        }
      } catch (error: any) {
        return {
          ...this.createBaseResult(item.group, item.index, item.departments),
          status: 'failed',
          operationUrl: item.operationUrl,
          error: this.getErrorMessage(error),
        };
      }
    }

    return {
      ...this.createBaseResult(item.group, item.index, item.departments),
      status: 'timed_out',
      operationUrl: item.operationUrl,
      error: 'Team creation polling timed out',
    };
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
      const users = await this.microsoftGraphClient.getMembersByDepartment(
        item.departments,
      );

      const addMembersResult = await this.microsoftGraphClient.addUsersToTeam(
        users,
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