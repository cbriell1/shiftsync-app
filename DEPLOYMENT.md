# Deployment Guide for ShiftSync App

This project is configured to deploy to **Vercel** using **GitHub Actions**.

## 1. Vercel Configuration

1.  **Create a Vercel Project**: Import this repository into Vercel.
2.  **Database**: Ensure you have a PostgreSQL database provisioned (e.g., Vercel Postgres, Supabase, Neon).
3.  **Environment Variables**: Add the following variables in the Vercel Dashboard (`Settings` -> `Environment Variables`):
    - `DATABASE_URL`: Your PostgreSQL connection string.
    - `AUTH_SECRET`: A random string for Auth.js (generate one with `openssl rand -base64 32`).
    - `EMERGENCY_PASSWORD`: The password for the emergency fallback login.
    - `NEXTAUTH_URL`: (Optional) Your production URL.

## 2. GitHub Actions Secrets

To enable the automated deployment pipeline, you must add the following secrets to your GitHub repository (`Settings` -> `Secrets and variables` -> `Actions`):

| Secret Name | Description |
| :--- | :--- |
| `VERCEL_TOKEN` | Your Vercel Personal Access Token. |
| `VERCEL_ORG_ID` | Your Vercel Organization ID. |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID. |
| `DATABASE_URL` | Used by GitHub Actions to run Prisma migrations during deployment. |

## 3. Deployment Pipeline

The pipeline (`.github/workflows/deploy.yml`) performs the following steps on every push to `main`:

1.  **Validate**: Lints, type-checks, and runs tests.
2.  **Build**: Uses Vercel CLI to build the project.
3.  **Migrate**: Runs `npx prisma migrate deploy` to ensure your production database schema is up to date.
4.  **Deploy**: Deploys the pre-built artifacts to Vercel.

## 4. Manual Seeding (Optional)

If you need to seed your database, you can run:

```bash
npx prisma db seed
```

*(Note: Ensure you have a seed script defined in `package.json` if you wish to use this command.)*
