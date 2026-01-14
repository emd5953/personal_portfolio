# Inline Editing System

The story page supports inline editing for thoughts and timeline entries with password protection.

## Features

- Password-protected editing
- Add, edit, and delete thoughts
- Add, edit, and delete timeline entries
- Session management (30-minute timeout)
- Rate limiting (5 failed attempts = 15-minute lockout)
- Data stored in Upstash Redis (Vercel KV)

## Setup

### 1. Environment Variables

Set in Vercel dashboard or `.env`:

```
EDIT_PASSWORD=your-secret-password
KV_REST_API_URL=your-upstash-url
KV_REST_API_TOKEN=your-upstash-token
```

### 2. Upstash Redis Setup

1. Go to Vercel dashboard → Storage tab
2. Click "Create Database" → Choose "Upstash" → "Redis"
3. Connect to your project
4. Environment variables are automatically added

### 3. Data Migration

To migrate existing data from JSON files to Redis:

```bash
node scripts/migrate-to-kv.js
```

## Local Development

For local development, use `server.js` which reads from `data/thoughts.json` and `data/timeline.json`:

```bash
node server.js
```

Visit `http://localhost:4000/pages/storyPage.html`

## Production

The API endpoint `/api/content.js` handles all CRUD operations on Vercel using Upstash Redis.

## Usage

1. Visit the story page
2. Click "add/edit an entry....." button
3. Enter password
4. Add/edit/delete thoughts and timeline entries
5. Changes are saved to Redis immediately
6. Session expires after 30 minutes of inactivity

## API Endpoints

### GET `/api/content?type=thoughts`
Returns all thoughts (public, no auth required)

### GET `/api/content?type=timeline`
Returns all timeline entries (public, no auth required)

### POST `/api/content?type=thoughts`
Add new thought (requires auth)

### PUT `/api/content?type=thoughts`
Update existing thought (requires auth)

### DELETE `/api/content?type=thoughts`
Delete thought (requires auth)

Same endpoints exist for `type=timeline`

## Security

- Password stored in environment variable
- Rate limiting on failed auth attempts
- Session timeout after 30 minutes
- Authorization header required for write operations
