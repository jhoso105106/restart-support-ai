export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  
  // Azure OpenAI configuration
  azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT ?? "",
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
  
  // Legacy Forge configuration (fallback)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
