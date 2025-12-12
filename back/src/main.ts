import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

   // --- Parser ---
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // --- CORS ---
  app.enableCors({
    origin: '*', 
    credentials: false,
  });


  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📘 Swagger available at http://localhost:${PORT}/api`);
}

bootstrap();
