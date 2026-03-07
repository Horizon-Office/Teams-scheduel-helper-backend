import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { response } from 'express';


interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  client_id: string;
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

@Injectable()
export class MicrosoftGraphSecurityClientService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;


  constructor(private readonly configService: ConfigService) {

    const config = this.configService.get('microsoftGraph');
    this.clientId = config.client_id;
    this.clientSecret = config.client_secret;
    this.tenantId = config.tenant_id;
    
    console.log('MicrosoftGraph service initialized');
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
