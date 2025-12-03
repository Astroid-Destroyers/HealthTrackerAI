# Deployment Guide for HealthTrackerAI

This document provides instructions for deploying the HealthTrackerAI application.

## Prerequisites

- **Node.js**: Version 20.x (LTS recommended)
- **npm**: Comes with Node.js
- A deployment platform account (Vercel, Netlify, or AWS Amplify)

## Why Not GitHub Pages?

This Next.js application uses:
- API routes in `pages/api/` that require server-side execution
- Server-side rendering (SSR) capabilities
- Cron jobs for scheduled tasks (defined in `vercel.json`)
- Integration with Firebase, OpenAI, and email services

These features require a Node.js runtime environment, which GitHub Pages does not provide. GitHub Pages only hosts static files.

## Recommended Deployment: Vercel

Vercel is the recommended platform as it's optimized for Next.js and provides zero-configuration deployment.

### Deploy to Vercel

1. **Sign up/Login to Vercel**: Visit [vercel.com](https://vercel.com)

2. **Import Repository**:
   - Click "New Project"
   - Import `Astroid-Destroyers/HealthTrackerAI` from GitHub
   - Vercel will auto-detect Next.js configuration

3. **Configure Environment Variables**:
   Add these variables in the Vercel dashboard (Settings → Environment Variables):
   
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FB_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FB_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FB_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FB_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FB_APP_ID=your-app-id
   NEXT_PUBLIC_FB_VAPID_KEY=your-vapid-key
   
   # Firebase Admin (Server-side)
   FB_PROJECT_ID=your-project-id
   FB_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel automatically builds and deploys your application
   - Future pushes to `main` branch will trigger automatic deployments

### Vercel Cron Jobs

The application includes cron jobs defined in `vercel.json`:
- Daily scheduled emails: `0 9 * * *` (9 AM daily)
- Weekly summary: `0 9 * * 1` (9 AM Mondays)

These are automatically configured when deployed to Vercel.

## Alternative: Deploy to Netlify

1. **Sign up/Login to Netlify**: Visit [netlify.com](https://netlify.com)

2. **Create New Site**:
   - Import from GitHub: `Astroid-Destroyers/HealthTrackerAI`

3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20`

4. **Environment Variables**:
   Add the same environment variables as listed in the Vercel section above.

5. **Netlify Functions**:
   Next.js API routes will be automatically converted to Netlify Functions.

**Note**: Netlify doesn't support `vercel.json` cron jobs. You'll need to set up scheduled functions separately.

## Alternative: Deploy to AWS Amplify

1. **Sign up/Login to AWS Amplify**: Visit [aws.amazon.com/amplify](https://aws.amazon.com/amplify/)

2. **Connect Repository**:
   - Create new app from GitHub
   - Select `Astroid-Destroyers/HealthTrackerAI`

3. **Build Settings**:
   AWS Amplify auto-detects Next.js. Verify:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Environment Variables**:
   Add environment variables in the Amplify console.

## Local Development

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Astroid-Destroyers/HealthTrackerAI.git
   cd HealthTrackerAI
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```
   
   If `package-lock.json` doesn't exist:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual credentials.

4. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Build Test

To test the production build locally:

```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Start production server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### TypeScript Check

To run TypeScript type checking:

```bash
npm run typecheck
```

**Note**: There are currently some pre-existing TypeScript errors in the codebase that don't prevent the build from succeeding.

## Manual Deployment

If you need to deploy manually without CI/CD:

### Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## CI/CD Workflows

This repository includes GitHub Actions workflows:

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:
- Installs dependencies
- Runs TypeScript typecheck (non-blocking)
- Runs tests (if present)
- Builds the application
- Uploads build artifacts

### Deploy Workflow (`.github/workflows/deploy.yml`)

Currently provides deployment instructions only. For automated deployment:
- Use Vercel's GitHub integration (recommended)
- Use Netlify's GitHub integration
- Or set up AWS Amplify with GitHub

## Required Secrets and Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Cloud Messaging
3. Generate a service account key for admin operations
4. Copy credentials to your deployment platform's environment variables

### OpenAI Setup

1. Create an account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key
3. Add `OPENAI_API_KEY` to environment variables

### Email Configuration (Optional)

The application uses Discord webhooks for contact form submissions. SMTP configuration is deprecated but documented in `.env.example` for reference.

## Known Issues

### Pre-existing Build Errors

⚠️ **IMPORTANT**: The repository currently has syntax errors in `pages/dashboard/profileSetUp.tsx` that prevent the build from succeeding:

- Line 228: Incorrect JSX syntax - `<Head />` is used as a self-closing tag but is followed by children elements
- Lines 91-95 in `eslint.config.mjs`: Empty plugin name in extends array causing ESLint errors

These issues need to be fixed before the CI workflow can pass successfully. The errors are **NOT** introduced by the CI/CD changes but pre-exist in the codebase.

**To fix `profileSetUp.tsx`**:
```tsx
// Current (incorrect) - self-closing tag with children:
<Head />
    <title>Profile | HealthTrackerAI</title>
</Head>

// Corrected - proper opening tag:
<Head>
    <title>Profile | HealthTrackerAI</title>
</Head>
```

**To fix `eslint.config.mjs`**:
Remove or fix lines 91-95 which have an invalid empty plugin reference in the extends array (`"next/core-web-vitals"` with no corresponding plugin configuration).

Once these issues are resolved, the build will succeed and the CI workflow will pass.

## Troubleshooting

### Build Fails

- **First, check if there are syntax errors in the code** (see Known Issues above)
- Ensure Node.js 20.x is installed
- Delete `node_modules` and `.next`, then reinstall: `npm ci && npm run build`
- Check that all environment variables are set

### TypeScript Errors

The codebase has some pre-existing TypeScript errors in addition to the syntax errors. These may not prevent builds once the syntax errors are fixed.

### API Routes Not Working

- Verify environment variables are correctly set in your deployment platform
- Check deployment logs for runtime errors
- Ensure your deployment platform supports serverless functions/API routes

## Branch Protection and PR Reviews

When setting up branch protection for `main`:
- Require CI workflow to pass before merging
- The `GITHUB_TOKEN` used by workflows has sufficient permissions for standard operations
- No additional secrets needed for CI/CD (deployment uses platform-specific integrations)

## Reverting Deployment

To revert to a previous deployment:

**Vercel**: 
- Go to Deployments tab
- Click "..." on the desired deployment
- Select "Promote to Production"

**Netlify**:
- Go to Deploys tab
- Click "Publish deploy" on any previous successful build

## Support

For deployment issues:
- Check the [Next.js deployment documentation](https://nextjs.org/docs/deployment)
- Review Vercel/Netlify/AWS logs
- Consult platform-specific support channels
