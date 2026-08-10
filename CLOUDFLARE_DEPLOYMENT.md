# Cloudflare Pages Build Configuration

This configuration enables deployment to Cloudflare Pages and Cloudflare Workers.

## Build Command
```
npm install --legacy-peer-deps && npm run build
```

## Environment Variables to Set in Cloudflare Dashboard

### Azure OpenAI (Recommended)
```
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Application Settings
```
NODE_ENV=production
VITE_APP_ID=your-app-id
JWT_SECRET=your-jwt-secret
DATABASE_URL=mysql://connection-string
OAUTH_SERVER_URL=https://oauth.server
OWNER_OPEN_ID=your-owner-id
```

## Deployment Steps

### Option 1: Deploy to Cloudflare Pages

1. Connect your Git repository to Cloudflare Pages
2. In Build Settings, set:
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Build output directory: `dist/public`
3. Add the environment variables above in Pages → Settings → Environment Variables
4. Trigger a deploy

### Option 2: Deploy to Cloudflare Workers

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate:
   ```bash
   wrangler login
   ```

3. Set secrets:
   ```bash
   wrangler secret put AZURE_OPENAI_API_KEY --env production
   wrangler secret put AZURE_OPENAI_ENDPOINT --env production
   wrangler secret put AZURE_OPENAI_DEPLOYMENT --env production
   wrangler secret put DATABASE_URL --env production
   wrangler secret put JWT_SECRET --env production
   wrangler secret put OAUTH_SERVER_URL --env production
   wrangler secret put OWNER_OPEN_ID --env production
   ```

4. Deploy:
   ```bash
   wrangler deploy --env production
   ```

## Node.js Compatibility

Cloudflare Workers requires Node.js compatibility mode. The `wrangler.toml` includes:
```
compatibility_date = "2024-08-01"
compatibility_flags = ["nodejs_compat"]
```

## Troubleshooting

- **API Key Not Configured**: Ensure `AZURE_OPENAI_API_KEY` is set in environment variables
- **Deployment Fails**: Check that build command runs locally: `npm run build`
- **AI Features Not Working**: Verify Azure OpenAI endpoint and deployment name are correct
