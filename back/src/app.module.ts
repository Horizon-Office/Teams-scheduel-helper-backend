import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './schedule/order/order.module';
import { ScheduleModule } from './schedule/schedule.module';
import clientConfig from './config/client.config';
import databaseConfig from './config/database.config';
import microsoftConfig from './config/graph.config';

@Module({
  imports: [
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
  ],
})
export class AppModule {}
