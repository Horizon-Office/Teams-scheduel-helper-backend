import { 
    Injectable, 
    Inject,
    UnauthorizedException 
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GraphUserResponse, MicrosoftGraphClientService } from 'src/client/microsoft_graph/microsoft_graph.service';
import { ref } from  'process';
import { response } from 'express';
import { access } from 'fs';

type Role = 'admin' | 'dispatcher';
const VALID_ROLES: Role[] = ['admin', 'dispatcher'];

export interface CachedTokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
  id_token: string;
  cached_at: number;
  jobTitle: string;
  mail:string
}

export interface validateAccessTokenResponse {
    validate: boolean,
    access_token?: string,
    refresh_token?: string,
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
            const email = userInfo.mail;
            if (!VALID_ROLES.includes(role)) {
                throw new Error(`Invalid role: ${role}`);
            }
            if (email) {
                const mailKey = `auth:mail:${email}`;
                const oldToken: string | null | undefined = await this.cacheManager.get(mailKey);

                if (oldToken) {
                    await this.cacheManager.del(`auth:token:${oldToken}`);
                }
                await this.cacheManager.set(mailKey, tokenResponse.access_token, tokenResponse.expires_in * 1000);
            }
            
            const cacheData = {
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                scope: tokenResponse.scope,
                expires_in: tokenResponse.expires_in,
                token_type: tokenResponse.token_type,
                id_token: tokenResponse.id_token,
                jobTitle: userInfo.jobTitle,
                mail: email,
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
        } 
        catch (error) {
            console.error("Authorization failed by invalid role or error:", error);
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

        const cacheKey = `auth:token:${accessToken}`;
        const cachedData: CachedTokenData | null | undefined = await this.cacheManager.get(cacheKey);

        if (!cachedData) {
            throw new UnauthorizedException('Invalid or expired token');
        }
        const now = Date.now();
        const expiresAt = cachedData.cached_at + (cachedData.expires_in * 1000);
        if (now > expiresAt) {
            if (cachedData.refresh_token) {
                try {
                    const refreshed = await this.refreshDelegateToken(
                        cachedData.refresh_token, 
                        cachedData.scope
                    );
                    return {
                        ...refreshed,
                        jobTitle: refreshed.user.jobTitle,
                        mail: refreshed.user.mail,
                        cached_at: Date.now() 
                    } as unknown as CachedTokenData;
                } catch (error) {
                    await this.cacheManager.del(cacheKey);
                    throw new UnauthorizedException('Session expired and refresh failed');
                }
            }
            await this.cacheManager.del(cacheKey);
            throw new UnauthorizedException('Token has expired');
        }
        const role = cachedData.jobTitle as Role;

        if (!role || !VALID_ROLES.includes(role)) {
            await this.cacheManager.del(cacheKey);
            throw new UnauthorizedException(`Access denied: Invalid or missing role "${role}"`);
        }
        return cachedData;
    }

    /**
    * Refresh token
    * @param refresh_token - The refresh token token  (string)
    * @param scope required for permision in Microsoft Graph
    * @returns The cached token data if valid
    * @throws UnauthorizedException if refresh token 
    */
    async refreshDelegateToken(refreshToken: string, scope: string) {

        const tokenResponse = await this.microsoftGraphClient.refreshDelegateToken(refreshToken, scope);
        const userInfo = await this.microsoftGraphClient.getUserInfo(tokenResponse.access_token);
        
        const email = userInfo.mail;
        const role = userInfo.jobTitle as Role;

        if (!VALID_ROLES.includes(role)) {
            throw new UnauthorizedException(`Invalid role after refresh: ${role}`);
        }

        if (email) {
            const mailKey = `auth:mail:${email}`;
            const oldToken = await this.cacheManager.get<string>(mailKey);
            if (oldToken) {
                await this.cacheManager.del(`auth:token:${oldToken}`);
            }
            await this.cacheManager.set(mailKey, tokenResponse.access_token, tokenResponse.expires_in * 1000);
        }

        const cacheData = {
            ...tokenResponse,
            jobTitle: role,
            mail: email,
            cached_at: Date.now(),
        };

        const cacheKey = `auth:token:${tokenResponse.access_token}`;
        await this.cacheManager.set(cacheKey, cacheData, tokenResponse.expires_in * 1000);

        return {
            ...tokenResponse,
            user: userInfo,
            cached: true
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
    
}