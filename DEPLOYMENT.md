# Deployment Guide

This guide covers deploying Memo Maker to production using Railway for the backend and Vercel for the frontend.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Post-Deployment](#post-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)
- [ ] AWS account with S3 bucket configured
- [ ] OpenAI API key (https://platform.openai.com)
- [ ] All environment variables documented

## Environment Setup

### Required Services

1. **PostgreSQL Database** - Provided by Railway
2. **Redis** - Provided by Railway
3. **AWS S3** - For audio file storage
4. **OpenAI API** - For transcription and memo generation

### Environment Variables

Copy the example files and fill in your values:

```bash
# Backend
cp backend/.env.production.example backend/.env.production

# Frontend
cp frontend-web/.env.production.example frontend-web/.env.production
```

## Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `memo-maker` repository
4. Railway will auto-detect the Node.js project

### Step 2: Add Services

Add the following services to your Railway project:

#### PostgreSQL Database

```bash
railway add postgres
```

Railway will automatically set the `DATABASE_URL` environment variable.

#### Redis

```bash
railway add redis
```

Railway will automatically set the `REDIS_URL` environment variable.

### Step 3: Configure Environment Variables

In the Railway dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3000

# JWT Configuration (generate secure random strings)
JWT_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-s3-bucket-name>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# CORS (your frontend URL)
CORS_ORIGIN=https://your-app.vercel.app
```

**To generate secure secrets:**

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: Configure Build and Start Commands

In Railway settings, configure:

- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`

### Step 5: Deploy Worker Process

The worker process handles background jobs (transcription, memo generation).

1. Create a new service in Railway for the worker
2. Point it to the same repository
3. Use the same environment variables
4. Set the start command to: `cd backend && node dist/worker.js`

### Step 6: Run Database Migrations

After first deployment, run migrations:

```bash
railway run --service=backend npx prisma migrate deploy
```

### Step 7: Verify Deployment

Check the logs in Railway dashboard to ensure:

- ✅ Server started successfully
- ✅ Database connection established
- ✅ Redis connection established
- ✅ Worker process running

## Frontend Deployment (Vercel)

### Step 1: Import Project

1. Go to https://vercel.com/new
2. Import your `memo-maker` repository
3. Vercel will auto-detect Next.js

### Step 2: Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend-web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel project settings, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_NAME=Memo Maker
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

### Step 6: Update Backend CORS

Update the `CORS_ORIGIN` environment variable in Railway to match your Vercel domain:

```
CORS_ORIGIN=https://your-app.vercel.app
```

## Post-Deployment

### Database Seeding (Optional)

If you want to seed initial data:

```bash
railway run --service=backend npm run seed
```

### Test the Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **Frontend Access**:
   - Visit your Vercel URL
   - Create a test account
   - Upload a test audio file
   - Verify memo generation

### Configure AWS S3 CORS

Add CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "https://your-backend.railway.app"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Set up GitHub Secrets

For CI/CD deployment, add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add:
   - `RAILWAY_TOKEN`: Get from Railway dashboard → Project → Settings → Tokens

## Monitoring and Maintenance

### Logging

- **Railway**: View logs in the Railway dashboard
- **Vercel**: View logs in the Vercel dashboard
- **OpenAI**: Monitor usage in OpenAI dashboard
- **AWS S3**: Enable S3 access logging

### Database Backups

Railway automatically backs up PostgreSQL databases. You can also set up manual backups:

```bash
# Backup database
railway run --service=backend pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run --service=backend psql $DATABASE_URL < backup.sql
```

### Monitoring Checklist

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Monitor OpenAI API usage and costs
- [ ] Monitor AWS S3 storage usage
- [ ] Set up budget alerts for all cloud services

### Scaling

#### Backend

Railway auto-scales based on traffic. To manually scale:

1. Go to Railway project
2. Click on backend service
3. Settings → Resources
4. Adjust replicas

#### Worker

Scale worker processes independently:

1. Monitor job queue length in Redis
2. If queue is consistently long, add more worker replicas
3. Adjust concurrency settings in worker configuration

### Database Migrations

When you need to run new migrations:

```bash
# From your local machine
railway run --service=backend npx prisma migrate deploy

# Or let the deploy workflow handle it (automatic)
```

### Troubleshooting

#### Backend won't start

- Check environment variables are set correctly
- Verify DATABASE_URL and REDIS_URL are configured
- Check logs for specific error messages

#### Worker not processing jobs

- Verify worker process is running in Railway
- Check Redis connection
- Verify OpenAI API key is valid
- Check worker logs for errors

#### Frontend can't connect to backend

- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS_ORIGIN in backend matches frontend URL
- Test backend health endpoint directly

#### Audio uploads fail

- Verify AWS credentials are correct
- Check S3 bucket permissions
- Verify S3 CORS configuration
- Check file size limits

### Rollback Procedure

If a deployment fails:

#### Railway Rollback

1. Go to Railway deployment history
2. Click on previous successful deployment
3. Click "Redeploy"

#### Vercel Rollback

1. Go to Vercel deployments
2. Find previous successful deployment
3. Click "..." menu → "Promote to Production"

#### Database Rollback

If migration fails:

```bash
# Rollback last migration
railway run --service=backend npx prisma migrate resolve --rolled-back <migration-name>
```

## Security Checklist

- [ ] All secrets are environment variables, not hardcoded
- [ ] JWT secrets are cryptographically random
- [ ] CORS is configured to allow only your frontend domain
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced on all domains
- [ ] S3 bucket is not publicly accessible
- [ ] Database has strong password
- [ ] API keys have appropriate permissions only

## Cost Estimation

### Railway

- **Hobby Plan**: $5/month (includes 500 hours)
- **Database**: ~$5-10/month
- **Redis**: ~$5/month
- **Total**: ~$15-20/month

### Vercel

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month (if needed)

### AWS S3

- **Storage**: $0.023/GB/month
- **Requests**: Minimal cost for typical usage
- **Estimated**: ~$5-10/month

### OpenAI

- **Whisper**: $0.006/minute of audio
- **GPT-4o-mini**: $0.15/1M input tokens, $0.60/1M output tokens
- **Estimated**: Depends on usage, ~$20-50/month for moderate use

**Total Monthly Cost**: ~$60-100/month

## Support

For issues with:

- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **OpenAI**: https://help.openai.com
- **AWS**: https://aws.amazon.com/support

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up error tracking (Sentry recommended)
4. Add analytics (optional)
5. Set up status page (optional)
6. Document incident response procedures
