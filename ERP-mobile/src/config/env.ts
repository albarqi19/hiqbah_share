// Demo/staging configuration only. Production endpoints must never be referenced here.

export const Env = {
  apiBaseUrl: 'https://demo-staging.example.invalid/api',
  environment: 'demo' as const,
} as const;
