import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import axios from 'axios';


interface GraphAddTeamMemberResult {
  userId: string;
  error: null | {
    code?: string;
    message?: string;
    [key: string]: any;
  };
}

export interface StartTeamCreationResult {
  teamName: string;
  status: 'accepted' | 'created';
  operationUrl?: string;
  teamId?: string;
}

interface GraphAddTeamMembersResponse {
  value?: GraphAddTeamMemberResult[];
}

interface AddDepartmentMembersToTeamResult {
  teamId: string;
  departments: string[];
  totalUsers: number;
  totalAdded: number;
  totalFailed: number;
  failedUsers: GraphAddTeamMemberResult[];
}

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

  /**
 * Starts Microsoft Teams creation and returns operation URL without waiting for provisioning.
 *
 * @param displayName Team name
 * @param ownerId Owner user ID
 * @param description Team description
 * @returns Operation URL or immediately created team ID
 */
  async startTeamCreation(
    displayName: string,
    ownerId: string,
    description: string,
  ): Promise<StartTeamCreationResult> {
    const token = await this.getAppToken();

    const payload = {
      'template@odata.bind': "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
      displayName,
      description,
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `${this.GRAPH_BASE_URL}/users('${ownerId}')`,
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
        },
      );

      if (response.status === 202) {
        const location = response.headers['location'];

        if (!location) {
          throw new Error('Location header is missing in 202 response');
        }

        return {
          teamName: displayName,
          status: 'accepted',
          operationUrl: this.normalizeGraphUrl(location),
        };
      }

      if (response.status === 201 && response.data.id) {
        return {
          teamName: displayName,
          status: 'created',
          teamId: response.data.id,
        };
      }

      throw new Error(`Unexpected Graph API response status: ${response.status}`);
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Graph API Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`,
        );
      }

      throw error;
    }
  }

  /**
   * Gets Teams async operation status.
   *
   * @param operationUrl URL from Location header
   * @returns Teams async operation status
   */
  async getTeamCreationOperation(
    operationUrl: string,
  ): Promise<GraphOperationResponse> {
    const token = await this.getAppToken();

    const response = await axios.get<GraphOperationResponse>(
      this.normalizeGraphUrl(operationUrl),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }

  private normalizeGraphUrl(url: string): string {
    if (url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${this.GRAPH_BASE_URL}${url}`;
    }

    return `${this.GRAPH_BASE_URL}/${url}`;
  }

  /**
   * Add all users from one or multiple departments to a Microsoft Teams team
   *
   * @param department Department name or list of department names
   * @param teamId Microsoft Teams team ID
   * @returns Summary with count of added and failed members
   */
  async addDepartmentMembersToTeam(
    department: string | string[],
    teamId: string,
  ): Promise<AddDepartmentMembersToTeamResult> {
    const token = await this.getAppToken();

    const departments = Array.isArray(department)
      ? department.map((item) => item.trim()).filter(Boolean)
      : [department.trim()].filter(Boolean);

    if (!teamId?.trim()) {
      throw new Error('teamId is required');
    }

    if (!departments.length) {
      return {
        teamId,
        departments: [],
        totalUsers: 0,
        totalAdded: 0,
        totalFailed: 0,
        failedUsers: [],
      };
    }

    const users = await this.getMembersByDepartment(departments);

    // на случай если при нескольких departments вдруг придут дубликаты
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.id, user])).values(),
    );

    if (!uniqueUsers.length) {
      return {
        teamId,
        departments,
        totalUsers: 0,
        totalAdded: 0,
        totalFailed: 0,
        failedUsers: [],
      };
    }

    const chunkSize = 200;
    const results: GraphAddTeamMemberResult[] = [];

    for (let i = 0; i < uniqueUsers.length; i += chunkSize) {
      const usersChunk = uniqueUsers.slice(i, i + chunkSize);

      const payload = {
        values: usersChunk.map((user) => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: [],
          'user@odata.bind': `${this.GRAPH_BASE_URL}/users('${user.id}')`,
        })),
      };

      try {
        const response = await axios.post<GraphAddTeamMembersResponse>(
          `${this.GRAPH_BASE_URL}/teams/${teamId}/members/add`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        results.push(...(response.data.value ?? []));
      } catch (error: any) {
        if (error.response) {
          throw new Error(
            `Graph API Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`,
          );
        }

        throw error;
      }
    }

    const failedUsers = results.filter((result) => result.error);
    const totalFailed = failedUsers.length;

    return {
      teamId,
      departments,
      totalUsers: uniqueUsers.length,
      totalAdded: uniqueUsers.length - totalFailed,
      totalFailed,
      failedUsers,
    };
  }

  /**
  * Creates Microsoft Team and waits until provisioning is completed.
  *
  * @param displayName Team name
  * @param ownerId Owner user ID
  * @param description Team description
  * @returns Created team name and ID
  */
  async createTeam(
    displayName: string,
    ownerId: string,
    description: string,
  ): Promise<{ teamName: string; teamId: string }> {
    const started = await this.startTeamCreation(
      displayName,
      ownerId,
      description,
    );

    if (started.status === 'created' && started.teamId) {
      return {
        teamName: started.teamName,
        teamId: started.teamId,
      };
    }

    if (!started.operationUrl) {
      throw new Error('Team creation operation URL is missing');
    }

    let attempts = 0;
    const maxAttempts = 24;
    const delayMs = 10_000;

    while (attempts < maxAttempts) {
      attempts++;

      await this.delay(delayMs);

      const operation = await this.getTeamCreationOperation(started.operationUrl);

      if (operation.status === 'succeeded') {
        if (!operation.targetResourceId) {
          throw new Error('Team creation succeeded but targetResourceId is missing');
        }

        return {
          teamName: started.teamName,
          teamId: operation.targetResourceId,
        };
      }

      if (operation.status === 'failed') {
        throw new Error(
          `Team provisioning failed: ${JSON.stringify(operation.error)}`,
        );
      }
    }

    throw new Error('Team creation polling timed out');
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
