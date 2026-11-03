# Lifestyle Health Backend

## Render deployment

Create a Render Web Service from the `lifestyle-health-backend` directory with:

- **Build command:** `npm ci`
- **Start command:** `npm start`
- **Health check path:** `/health`

Set these environment variables in Render:

- `NODE_ENV=production`
- `PORT` is provided by Render
- `MONGO_URI`
- `JWT_SECRET`
- `FLASK_API_URL`
- `CLIENT_ORIGIN` set to the deployed Vercel frontend URL
- `FIREBASE_SERVICE_ACCOUNT_JSON` containing the Firebase service-account JSON

The Firebase service-account file is ignored by Git. In hosted environments,
`server.js` reads the JSON from `FIREBASE_SERVICE_ACCOUNT_JSON` instead.

## Local development

```powershell
npm install
npm start
```

The frontend uses `VITE_API_BASE_URL` for the deployed API URL. For local
development it falls back to `http://localhost:3000/api`.
