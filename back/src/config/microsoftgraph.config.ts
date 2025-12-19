import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('microsoftGraph', () => {
    
      const schema = Joi.object({
        client_id: Joi.string().required(),
        client_secret: Joi.string().required(),
        tenant_id: Joi.string().required(),
      });
    
      const values = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        tenant_id: process.env.TENANT_ID,
      };
    
      const { error, value } = schema.validate(values, {
        allowUnknown: true,
        abortEarly: false,
      });
    
      if (error) {
        throw new Error(`Microsoft Graph config validation error: ${error.message}`);
      }
      console.log('Microsoft Graph configuration loaded successfully.');
    
      return {
        client_id: value.client_id,
        client_secret: value.client_secret,
        tenant_id: value.tenant_id,
      };
});