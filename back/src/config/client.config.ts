// client.config.ts
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('client', () => {
  const schema = Joi.object({
    mode: Joi.string()
      .valid('dev', 'prod')
      .required()
      .messages({
        'any.required': 'CLIENT_MODE is required',
        'any.only': 'CLIENT_MODE must be either "dev" or "prod"'
      }),
    
    jwt: Joi.string()
      .min(1)
      .required()
      .messages({
        'any.required': 'CLIENT_JWT is required',
        'string.empty': 'CLIENT_JWT cannot be empty'
      }),
    
    corsOrigins: Joi.alternatives()
      .try(
        Joi.string().valid('*'),
        Joi.array().items(Joi.string().uri())
      )
      .required(),
  });

  const mode = process.env.CLIENT_MODE;
  const jwt = process.env.CLIENT_JWT;
  const rawCorsOrigins = process.env.CLIENT_CORS_ORIGINS || '';

  if (!mode) {
    throw new Error('CLIENT_MODE environment variable is required. Set to "dev" or "prod"');
  }
  if (!jwt) {
    throw new Error('CLIENT_JWT environment variable is required');
  }

  let corsOrigins: string | string[];
  if (rawCorsOrigins === '*') {
    corsOrigins = '*';
  } else if (rawCorsOrigins.trim() === '') {
    if (mode === 'dev') {
      corsOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
      console.log('Development mode: Using default localhost origins');
    } 
    else {
      throw new Error(
        'In production mode (CLIENT_MODE=prod), CLIENT_CORS_ORIGINS must be specified. ' +
        'Provide a comma-separated list of domains or use "*" to allow all origins.'
      );
    }
  } else {
    corsOrigins = rawCorsOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
  }

  const values = {
    mode,
    jwt,
    corsOrigins,
  };

  const { error, value } = schema.validate(values, {
    allowUnknown: false,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Client config validation error: ${error.message}`);
  }

  console.log('Client configuration loaded successfully');
  console.log(`Mode: ${value.mode}`);
  console.log(`Allowed origins: ${Array.isArray(value.corsOrigins) ? value.corsOrigins.join(', ') : value.corsOrigins}`);

  return {
    mode: value.mode,
    jwt: value.jwt,
    corsOrigins: value.corsOrigins,
  };
});