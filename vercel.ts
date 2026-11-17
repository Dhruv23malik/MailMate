import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'npm run build',
  framework: 'nextjs',
  devCommand: 'npm run dev',
  installCommand: 'npm install',
  regions: ['iad1'],
  functions: {
    'src/app/api/**/*.ts': {
      maxDuration: 60,
    },
  },
  headers: [
    routes.cacheControl('/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
  ],
  rewrites: [
    routes.rewrite('/api/emails/(.*)', '/api/emails/$1'),
  ],
  crons: [
    { path: '/api/cron/sync-emails', schedule: '0 * * * *' }, // Every hour
  ],
  env: {
    MONGODB_URI: deploymentEnv('MONGODB_URI'),
    GROQ_API_KEY: deploymentEnv('GROQ_API_KEY'),
    GOOGLE_CLIENT_ID: deploymentEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: deploymentEnv('GOOGLE_CLIENT_SECRET'),
    GOOGLE_REDIRECT_URI: deploymentEnv('GOOGLE_REDIRECT_URI'),
    NEXTAUTH_SECRET: deploymentEnv('NEXTAUTH_SECRET'),
    NEXTAUTH_URL: deploymentEnv('NEXTAUTH_URL'),
  },
};