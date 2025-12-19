import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';


interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  client_id: string;
}

@Injectable()
export class MicrosoftGraphClientService {
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
   * Получение токена делегирования по device code
   * @param device_code Код устройства, полученный из device code flow
   * @param grant_type Тип гранта (по умолчанию urn:ietf:params:oauth:grant-type:device_code)
   * @returns Ответ с токеном доступа
   */
  
  async getDelegateToken(
    device_code: string, 
    grant_type: string = 'urn:ietf:params:oauth:grant-type:device_code'
    ): Promise<TokenResponse> {
    
    const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    
    const requestBody = new URLSearchParams({
        client_id: this.clientId,
        grant_type: grant_type,
        device_code: device_code,
    }).toString();

    const requestConfig = {
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    const response = await axios.post<TokenResponse>(url, requestBody, requestConfig);    
    return response.data;

    }
}
