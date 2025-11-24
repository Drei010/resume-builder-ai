# TalentEdge AI Resume Builder - Deployment Guide

## Vercel Deployment

This application is configured for easy deployment to Vercel with both frontend and backend capabilities.

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with this code
- OpenAI API key
- Google Gemini API key

### Environment Variables

Set these environment variables in Vercel project settings:

```
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Deployment Steps

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**

   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Vercel will auto-detect Next.js/React settings

3. **Set Environment Variables**

   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `OPENAI_API_KEY` and `GEMINI_API_KEY`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### What Gets Deployed

- **Frontend**: React app built to `/dist` folder (Vite build)
- **Backend**: Node.js Express server for resume generation API
- **API Routes**: All `/api/*` requests routed to `server.js`
- **Static Files**: All other routes serve the React app

### API Endpoint on Vercel

Once deployed, your API will be available at:

```
https://your-vercel-deployment.vercel.app/api/generate-resume
```

Update the frontend API calls if needed in `src/pages/Index.tsx`:

```typescript
// Change from localhost:3001 to your Vercel URL
const response = await fetch("https://your-vercel-deployment.vercel.app/api/generate-resume", {
```

### Troubleshooting

- **Build fails**: Check that all dependencies are listed in `package.json`
- **API errors**: Verify environment variables are set correctly
- **CORS issues**: Already configured in `server.js`
- **Timeout errors**: API calls might exceed 10s limit; consider implementing queues for long-running tasks

### Local Testing Before Deployment

```bash
# Test build
npm run build

# Test production build locally
npm run preview
```
