import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import axios from 'axios';

type AddUserStatus = 'added' | 'already_exists' | 'failed';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  client_id: string;
}

interface AppTokenCache {
  accessToken: string;
  expiresAt: number;
}

interface TokenRefresh {
  token_type: string;
  scope?: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
}

interface AddTeamMemberResult {
  userId: string;
  displayName: string;
  status: AddUserStatus;
  statusCode?: number;
  error?: string;
}

interface AddDepartmentMembersResult {
  teamId: string;
  departments: string[];
  totalUsers: number;
  totalAdded: number;
  totalAlreadyExists: number;
  totalFailed: number;
  results: Record<string, AddTeamMemberResult>;
}


export interface GraphUserResponse {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle: string,
  id: string;
}

export interface GraphOperationResponse {
  status: 'notStarted' | 'inProgress' | 'succeeded' | 'failed';
  targetResourceId?: string;
  error?: any;
}

export interface GraphTeamCreateResponse {
  id: string;
  // другие поля, если нужны, но для логики достаточно id
}

@Injectable()
export class MicrosoftGraphSecurityClientService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;
  private readonly GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
  private readonly APP_TOKEN_CACHE_KEY = 'microsoft-graph:app-token';
  private normalizeDepartments(department: string | string[]): string[] {
    const departments = Array.isArray(department)
      ? department
      : [department];

    return departments
      .map((item) => item.trim())
      .filter(Boolean);
  };

  constructor(
    private readonly configService: ConfigService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    const config = this.configService.get('microsoftGraph');

    this.clientId = config.client_id;
    this.clientSecret = config.client_secret;
    this.tenantId = config.tenant_id;

    console.log('MicrosoftGraph service initialized');
  }

  /**
   * Retrieve Microsoft Graph users by one or multiple departments
   *
   * @param department Department name or list of department names used in the users filter
   * @returns List of users from the specified department or departments
   */
  async getMembersByDepartment(
    department: string | string[],
  ): Promise<GraphUserResponse[]> {
    const token = await this.getAppToken();

    const departments = Array.isArray(department)
      ? department
      : [department];

    const normalizedDepartments = departments
      .map((item) => item.trim())
      .filter(Boolean);

    if (!normalizedDepartments.length) {
      return [];
    }

    const departmentFilter = normalizedDepartments
      .map((item) => {
        const safeDepartment = item.replace(/'/g, "''");
        return `department eq '${safeDepartment}'`;
      })
      .join(' or ');

    const response = await axios.get<{ value: GraphUserResponse[] }>(
      `${this.GRAPH_BASE_URL}/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ConsistencyLevel: 'eventual',
        },
        params: {
          $filter: departmentFilter,
          $select: 'id,displayName,mail,userPrincipalName,jobTitle',
        },
      },
    );

    return response.data.value ?? [];
  }

  async addDepartmentMembersToTeam(
    departments: string[],
    teamId: string,
  ): Promise<AddDepartmentMembersResult> {
    const users = await this.getMembersByDepartment(departments);
    const token = await this.getAppToken();

    const tempCachePrefix = `teams:add-members:${teamId}:${departments.join('-')}:${Date.now()}`;

    const concurrency = 4;

    await this.mapWithConcurrency(users, concurrency, async (user, index) => {
      await this.sleep(index * 300);

      const result = await this.addSingleUserToTeamWithRetry({
        token,
        teamId,
        userId: user.id,
        displayName: user.displayName,
      });

      await this.cacheManager.set(
        `${tempCachePrefix}:${user.id}`,
        result,
        60 * 60,
      );

      return result;
    });

    const cachedEntries = await Promise.all(
      users.map(async (user) => {
        const result = await this.cacheManager.get<AddTeamMemberResult>(
          `${tempCachePrefix}:${user.id}`,
        );

        if (!result) {
          return null;
        }

        return [user.id, result] as const;
      }),
    );

    const results: Record<string, AddTeamMemberResult> = Object.fromEntries(
      cachedEntries.filter(
        (entry): entry is readonly [string, AddTeamMemberResult] => entry !== null,
      ),
    );

    await Promise.all(
      users.map((user) => this.cacheManager.del(`${tempCachePrefix}:${user.id}`)),
    );

    const values = Object.values(results);

    return {
      teamId,
      departments,
      totalUsers: users.length,
      totalAdded: values.filter((item) => item.status === 'added').length,
      totalAlreadyExists: values.filter((item) => item.status === 'already_exists').length,
      totalFailed: values.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  private async addSingleUserToTeamWithRetry(params: {
    token: string;
    teamId: string;
    userId: string;
    displayName: string;
    attempt?: number;
  }): Promise<AddTeamMemberResult> {
    const { token, teamId, userId, displayName } = params;
    const attempt = params.attempt ?? 1;

    try {
      await axios.post(
        `${this.GRAPH_BASE_URL}/teams/${teamId}/members`,
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: [],
          'user@odata.bind': `${this.GRAPH_BASE_URL}/users('${userId}')`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        userId,
        displayName,
        status: 'added',
        statusCode: 201,
      };
    } catch (error: any) {
      const statusCode = error.response?.status;

      const graphMessage =
        error.response?.data?.error?.message ??
        error.message ??
        'Unknown Graph API error';

      const isAlreadyExists =
        statusCode === 409 ||
        graphMessage.toLowerCase().includes('already exist') ||
        graphMessage.toLowerCase().includes('already a member');

      if (isAlreadyExists) {
        return {
          userId,
          displayName,
          status: 'already_exists',
          statusCode,
          error: graphMessage,
        };
      }

      if (statusCode === 429 && attempt < 4) {
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        const retryAfterSeconds = Number(retryAfterHeader);

        const delayMs = Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds * 1000
          : attempt * 3000;

        await this.sleep(delayMs);

        return this.addSingleUserToTeamWithRetry({
          token,
          teamId,
          userId,
          displayName,
          attempt: attempt + 1,
        });
      }

      return {
        userId,
        displayName,
        status: 'failed',
        statusCode,
        error: graphMessage,
      };
    }
  }

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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Создает команду в Microsoft Graph и дожидается окончания провиженинга
   * @param displayName Имя команды
   * @param ownerId ID пользователя, который станет владельцем (UUID)
   * @param description Описание команды
   * @returns Объект с именем и ID созданной команды
   */
  async createTeam(
    displayName: string,
    ownerId: string,
    description: string
  ): Promise<{ teamName: string; teamId: string }> {
    const token = await this.getAppToken();
    const payload = {
      'template@odata.bind': "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
      displayName: displayName,
      description: description,
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${ownerId}')`,
        },
      ],
    };

    try {
      const response = await axios.post<GraphTeamCreateResponse>(
        `${this.GRAPH_BASE_URL}/teams`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 202) {
        let operationUrl = response.headers['location'];
        if (!operationUrl) {
          throw new Error('Location header is missing in 202 response');
        }

        if (operationUrl.startsWith('/')) {
          operationUrl = `https://graph.microsoft.com/v1.0${operationUrl}`;
        }

        let isComplete = false;
        let attempts = 0;
        const maxAttempts = 24;
        const delayMs = 5000;

        while (!isComplete && attempts < maxAttempts) {
          attempts++;

          await new Promise((resolve) => setTimeout(resolve, delayMs));

          const opResponse = await axios.get<GraphOperationResponse>(operationUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const opStatus = opResponse.data.status;

          if (opStatus === 'succeeded') {
            isComplete = true;
            return {
              teamName: displayName,
              teamId: opResponse.data.targetResourceId as string,
            };
          } else if (opStatus === 'failed') {
            throw new Error(`Team provisioning failed: ${JSON.stringify(opResponse.data.error)}`);
          }
        }

        throw new Error('Team creation polling timed out (process took too long)');
      }

      // Если по какой-то причине API сразу вернет 201 Created (иногда бывает в Graph API)
      if (response.status === 201 && response.data.id) {
        return {
          teamName: displayName,
          teamId: response.data.id,
        };
      }

      throw new Error(`Unexpected Graph API response status: ${response.status}`);

    } catch (error: any) {
      if (error.response) {
        // Логируем или пробрасываем ошибку от самого Graph API (например, 400 Bad Request)
        throw new Error(`Graph API Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getAppToken(): Promise<string> {
    const cachedToken = await this.cacheManager.get<AppTokenCache>(
      this.APP_TOKEN_CACHE_KEY,
    );

    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.accessToken;
    }

    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get app token: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    const expiresAt = Date.now() + (data.expires_in - 300) * 1000;

    await this.cacheManager.set(
      this.APP_TOKEN_CACHE_KEY,
      {
        accessToken: data.access_token,
        expiresAt,
      },
      data.expires_in - 300,
    );

    return data.access_token;
  }

  /**
   * Obtain a delegation token using an authorization code
   * @param authCode Authorization code received from the callback
   * @param scope Requested access scopes
   * @param redirect_uri Redirect URI registered in the application
   * @returns Access token response or Graph API error response
   */
  async getDelegateToken(authCode: string, scope: string, redirect_uri: string): Promise<TokenResponse | any> {
    const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const requestBody = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirect_uri,
      scope: scope,
    }).toString();

    const requestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    try {
      const response = await axios.post<TokenResponse>(url, requestBody, requestConfig);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
  * Delegate token refresh
  * @param refresh_token token used for refresh
  * @param scope requested access scopes
  * @returns response with access token
  */
  async refreshDelegateToken(
    refresh_token: string,
    scope: string
  ): Promise<TokenRefresh> {
    const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token,
      scope,
    }).toString();

    const response = await axios.post<TokenRefresh>(
      url,
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': ''
        },
      }
    );

    return response.data;

  }

  /**
  * Get information about the current user using a delegation token
  * @param accessToken User's delegation token
  * @returns User information
  */
  async getUserInfo(accessToken: string): Promise<GraphUserResponse> {
    const url = 'https://graph.microsoft.com/v1.0/me';

    const response = await axios.get<GraphUserResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;

  }

}
