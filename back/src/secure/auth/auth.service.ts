import { 
    Injectable, 
    Inject,
    UnauthorizedException 
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MicrosoftGraphClientService } from 'src/client/microsoft_graph/microsoft_graph.service';

interface CachedTokenData {
    access_token: string;
    refresh_token?: string;
    scope: string;
    expires_in: number;
    ext_expires_in: number;
    token_type: string;
    id_token?: string;
    client_id: string;
    cached_at: number;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly microsoftGraphClient: MicrosoftGraphClientService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}
    

    /**
     * Validates the device code and stores the token in Redis
     * @param device_code Device code
     * @param grant_type Grant type (optional)
     * @returns Successful response containing the token
     */
    async checkDeviceCode(device_code: string, grant_type?: string) {
        const tokenResponse = await this.microsoftGraphClient.getDelegateToken(
        device_code, 
        grant_type
        );
        const cacheData = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        scope: tokenResponse.scope,
        expires_in: tokenResponse.expires_in,
        ext_expires_in: tokenResponse.expires_in * 2, 
        token_type: tokenResponse.token_type,
        id_token: tokenResponse.id_token,
        client_id: tokenResponse.client_id,
        cached_at: Date.now(),
        };
        const cacheKey = `auth:token:${tokenResponse.access_token}`;
        const ttl = tokenResponse.expires_in * 1000; 
        await this.cacheManager.set(cacheKey, cacheData, ttl);
        return {
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        scope: tokenResponse.scope,
        cached: true,
        };
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
        const now = Date.now();
        const cachedAt = cachedData.cached_at;
        const expiresIn = cachedData.expires_in * 1000; 
        if (now - cachedAt > expiresIn) {
            await this.cacheManager.del(cacheKey);
            throw new UnauthorizedException('Token has expired');
        }
        return cachedData;
    }
    
}