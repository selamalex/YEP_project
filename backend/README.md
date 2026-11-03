# YEP Initiative - Backend Microservice

This `backend/` folder provides server-side logic for the YEP Initiative website:
1. **AI Chatbot Proxy (`POST /api/chat`)**: Keeps your `GEMINI_API_KEY` private and unexposed to clients, provides rate limiting, injects system knowledge, and connects to live Supabase event data.
2. **Contact Message Anti-Spam & Rate Limiting (`POST /api/contact`)**: Enforces rate limiting per IP address, string trimming, length bounds, and persistent storage.
3. **Health Check (`GET /api/health`)**: Monitors service uptime, GEMINI configuration status, and database connectivity.

> **Note on Architecture:**
> The frontend is built with TanStack Start, which also supports serverless server functions directly on Vercel. You can either:
> - **Option A (All-in-One on Vercel)**: Set `GEMINI_API_KEY` and Supabase keys directly in Vercel. The built-in server functions in `src/server/chat.ts` will handle AI queries directly on Vercel without a second deployment.
> - **Option B (Separate Backend Service)**: Deploy this `backend/` folder to a service like Render, Railway, or Fly.io, and set `BACKEND_URL` in your Vercel frontend environment variables.

---

## Local Development

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in your `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will be available at `http://localhost:3001`.

---

## Deployment Instructions

### Deploy to Render
1. Create a **Web Service** on [Render.com](https://render.com).
2. Connect your repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   - `PORT`: `3001`
   - `GEMINI_API_KEY`: Your secret GEMINI key.
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://yepproject.vercel.app`).
5. Copy the deployed Render URL (e.g., `https://yep-backend.onrender.com`) and add it to your Vercel project settings as `BACKEND_URL`.

### Deploy to Railway
1. Create a new project on [Railway.app](https://railway.app).
2. Deploy from GitHub repository, set Root Directory to `/backend`.
3. Add the environment variables from `.env.example`.
4. Copy the public Railway URL into your Vercel frontend as `BACKEND_URL`.

