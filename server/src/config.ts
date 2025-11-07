import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// validate and coerce env vars
const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().positive().int().default(8000),
    HOST: z.string().default('localhost'),

    DATABASE_URL: z.string().min(1),
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error('Invalid environment variables');
}

export const ENV = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  host: parsed.data.HOST,

  databaseUrl: parsed.data.DATABASE_URL,
  db: {
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    name: parsed.data.DB_NAME,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },

} as const;


export type Env = typeof ENV;
export default ENV;