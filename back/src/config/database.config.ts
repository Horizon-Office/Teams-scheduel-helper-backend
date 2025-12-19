// database.config.ts
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('database', () => {

  const schema = Joi.object({
    host: Joi.string().default('localhost'),
    port: Joi.number().port().default(5432),
    username: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    synchronize: Joi.boolean().default(false),
    migrationsRun: Joi.boolean().default(false),
  });

  const values = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
    synchronize: process.env.DB_SYNCHRONIZE,
    migrationsRun: process.env.DB_MIGRATIONS_RUN,
  };

  const { error, value } = schema.validate(values, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Database config validation error: ${error.message}`);
  }
  console.log('Database configuration loaded successfully.');

  return {
    host: value.host,
    port: parseInt(value.port, 10),
    username: value.username,
    password: value.password,
    name: value.name,
    synchronize: value.synchronize === 'true' || value.synchronize === true,
    migrationsRun: value.migrationsRun === 'true' || value.migrationsRun === true,
  };
});