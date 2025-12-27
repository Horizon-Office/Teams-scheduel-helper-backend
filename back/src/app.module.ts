import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './schedule/order/order.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SecureModule } from './secure/secure.module';
import { ClientModule } from './client/client.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MembersModule } from './members/members.module';
import clientConfig from './config/client.config';
import databaseConfig from './config/database.config';
import microsoftConfig from './config/microsoftgraph.config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      socket: {
        host: 'localhost',
        port: 6379,
      },
      ttl: 0,        
      isGlobal: true 
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, microsoftConfig, clientConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig.username || !dbConfig.password || !dbConfig.name) {
          throw new Error('Missing required database configuration');
        }

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          entities: [__dirname + '/../**/*.entity{.ts}'],
          migrations: [__dirname + '/../migrations/*{.ts}'],
          autoLoadEntities: true,
          migrationsRun: dbConfig.migrationsRun,
          synchronize: dbConfig.synchronize,
          logging: ['query', 'error', 'schema'],
        };
      },
      inject: [ConfigService],
    }),

    OrderModule,
    ScheduleModule,
    SecureModule,
    ClientModule,
    MembersModule,
    
  ],
})
export class AppModule {}
