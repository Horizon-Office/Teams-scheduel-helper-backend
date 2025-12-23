import { 
    Injectable, 
    Inject,
    UnauthorizedException 
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GraphUserResponse, MicrosoftGraphClientService } from 'src/client/microsoft_graph/microsoft_graph.service';
import { ref } from 'process';

type Role = 'admin' | 'dispatcher';
const VALID_ROLES: Role[] = ['admin', 'dispatcher'];

export interface CachedTokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  token_type: string;
  id_token: string;
  user: GraphUserResponse;
  cached_at: number;
  jobTitle: string;
}


@Injectable()
export class AuthService {
    constructor(
        private readonly microsoftGraphClient: MicrosoftGraphClientService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}
    

    /**
     * Validates the device code and stores the token in Redis
     * @param authCode code required for delegate token
     * @param scope required for permision in Microsoft Graph
     * @param redirect_uri registered redirect URI
     * @returns Successful response containing the token
     */
    async getIdentifiedDelegateToken(authCode: string, scope: string, redirect_uri: string) {

    const tokenResponse = await this.microsoftGraphClient.getDelegateToken(authCode, scope, redirect_uri);
    const userInfo = await this.microsoftGraphClient.getUserInfo(tokenResponse.access_token);

    try {
        const role = userInfo.jobTitle as Role;

        if (!VALID_ROLES.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
            
        const cacheData = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            scope: tokenResponse.scope,
            expires_in: tokenResponse.expires_in,
            ext_expires_in: tokenResponse.expires_in * 2,
            token_type: tokenResponse.token_type,
            id_token: tokenResponse.id_token,
            user: userInfo,
            jobTitle: userInfo.jobTitle,
            cached_at: Date.now(),
        };

        const cacheKey = `auth:token:${tokenResponse.access_token}`;
        const ttl = tokenResponse.expires_in * 1000;
        await this.cacheManager.set(cacheKey, cacheData, ttl);

        return {
            ...tokenResponse,
            cached: true,
            user: userInfo,
        };
    } catch (error) {
        console.error("Authtorization failed by ivalide role:", error);
        throw error; 
    }
    }

    /**
    * Validates if the access token exists in cache
    * @param accessToken - The access token to validate (string)
    * @returns The cached token data if valid
    * @throws UnauthorizedException if token is invalid or expired
    */
    async validateAccessToken(accessToken: string): Promise<CachedTokenData> {
        if (!accessToken || accessToken.trim() === '') {
            throw new UnauthorizedException('Access token is required');
        }

        const cacheKey = `auth:token:${accessToken}`;
        const cachedData: CachedTokenData | null | undefined = await this.cacheManager.get(cacheKey);

        if (!cachedData) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        // 1. Проверка срока действия
        const now = Date.now();
        const expiresAt = cachedData.cached_at + (cachedData.expires_in * 1000);

        if (now > expiresAt) {
            await this.cacheManager.del(cacheKey);
            throw new UnauthorizedException('Token has expired');
        }

        // 2. Проверка роли напрямую из поля jobTitle в кеше
        const role = cachedData.jobTitle as Role;

        if (!role || !VALID_ROLES.includes(role)) {
            // Если роли нет или она не входит в список разрешенных
            await this.cacheManager.del(cacheKey);
            throw new UnauthorizedException(`Access denied: Invalid or missing role "${role}"`);
        }

        return cachedData;
    }


    /**
    * Extracts token from Authorization header
    * @param authHeader - The Authorization header (e.g., "Bearer abc123")
    * @returns The extracted token
    * @throws UnauthorizedException if header is invalid
    */
    extractTokenFromHeader(authHeader: string): string {
        if (!authHeader) {
        throw new UnauthorizedException('Authorization header is missing');
        }
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid authorization header format. Expected: Bearer <token>');
        }
        return token;
    }
    


    
}