import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { MicrosoftGraphSecurityClientService } from './microsoft_graph_security.service';
import clientConfig from '../../config/client.config';
import databaseConfig from '../../config/database.config';
import microsoftConfig from '../../config/microsoftgraph.config';

describe('MicrosoftGraph (Integration)', () => {
    let service: MicrosoftGraphSecurityClientService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [databaseConfig, microsoftConfig, clientConfig],
                    isGlobal: true,
                    envFilePath: '.env',
                }),

                CacheModule.register({
                    store: redisStore as any,
                    socket: {
                        host: 'localhost',
                        port: 6379,
                    },
                    ttl: 0,
                    isGlobal: true,
                }),
            ],
            providers: [MicrosoftGraphSecurityClientService],
        }).compile();

        service = module.get<MicrosoftGraphSecurityClientService>(
            MicrosoftGraphSecurityClientService,
        );
    });

    it('should REALY add members from multiple departments to Microsoft Teams team', async () => {
        const realDepartments = [
            'ФІТ'
        ];

        const realTeamId = '10d68861-01c0-4900-ab1e-00ee9d512f8f';

        console.log('🚀 Начинаем интеграционный тест добавления пользователей...');
        console.log(`🏢 Departments: ${realDepartments.join(', ')}`);
        console.log(`👥 Team ID: ${realTeamId}`);

        try {
            console.log('🔎 Получаем пользователей департаментов...');
            console.log('➕ Добавляем пользователей в команду через Microsoft Graph...');

            const result = await service.addDepartmentMembersToTeam(
                realDepartments,
                realTeamId,
            );

            console.log('✅ Добавление пользователей завершено!');
            console.log('🏢 Департаменты:', result.departments);
            console.log('👥 Всего уникальных пользователей найдено:', result.totalUsers);
            console.log('✅ Добавлено:', result.totalAdded);
            console.log('ℹ️ Уже были в команде:', result.totalAlreadyExists);
            console.log('❌ Ошибок:', result.totalFailed);
            console.log('📊 Полный результат:', JSON.stringify(result, null, 2));

            expect(result).toBeDefined();
            expect(result.teamId).toBe(realTeamId);
            expect(result.departments).toEqual(realDepartments);
            expect(result.totalUsers).toBeGreaterThan(0);

            expect(
                result.totalAdded + result.totalAlreadyExists + result.totalFailed,
            ).toBe(result.totalUsers);
        } catch (error: any) {
            console.error('❌ Ошибка в ходе выполнения теста добавления пользователей:');

            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(error.message);
            }

            throw error;
        }
    }, 300000);
});