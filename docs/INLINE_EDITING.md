# Inline Editing Feature

story page now supports inline editing! can add, edit, and delete thoughts and timeline entries directly from the page.

## How it works

1. **Authentication**: Click the lock icon in the nav to enter your edit password
2. **Edit Mode**: Once authenticated, click "edit" to enable editing
3. **Add Content**: Click the "+" buttons to add new thoughts or timeline entries
4. **Edit Existing**: Click the pencil icon on any item to edit it
5. **Delete**: Click the trash icon to delete items
6. **Sync**: Click the " sync" button to download your latest content

## Sync Workflow (Important!)

Since you edit live but code locally, here's how to stay in sync:

### After editing live content:
1. Click the " sync" button in the nav (when logged in)
2. This downloads 3 files: `thoughts.json`, `timeline.json`, and `sync-info.json`
3. Replace your local `data/thoughts.json` with the downloaded version
4. Replace your local `data/timeline.json` with the downloaded version
5. Commit and push the changes: `git add data/ && git commit -m "sync content" && git push`

### The sync-info.json file tells you:
- When the export was made
- How many items were exported
- Step-by-step sync instructions

## Setup

1. **Set your password**: Update `EDIT_PASSWORD` in your `.env` file
2. **Deploy**: Push to Vercel - the API endpoints will work automatically
3. **Data**: Your content is stored in JSON files in the `data/` folder

## API Endpoints

- `GET /api/content?type=thoughts` - Get all thoughts
- `GET /api/content?type=timeline` - Get all timeline entries
- `GET /api/content?action=export` - Export all content (requires auth)
- `POST /api/content?type=thoughts` - Add new thought (requires auth)
- `PUT /api/content?type=thoughts` - Update thought (requires auth)
- `DELETE /api/content?type=thoughts` - Delete thought (requires auth)

Same endpoints work for `timeline` type.

## Security

- Only you can edit (password protected)
- Visitors can only view
- Password is stored in environment variables
- All write operations require authentication

## Data Storage & Sync

**Live Site**: Content stored in `data/` folder on Vercel server
**Local Repo**: Content stored in `data/` folder in your git repo
**Sync Process**: Use the sync button to download and manually update local files

This approach gives you:
-  Live editing capability
-  Full control over your local repo
-  No automatic git commits
-  Manual sync when you want it

## Features

-  Click-to-edit existing content
-  Add new thoughts and timeline entries
-  Delete unwanted content
-  Export/sync functionality
-  Real-time updates (no page refresh needed)
-  Mobile responsive editing
-  Password protection
-  Smooth animations and transitions

## Usage Tips

- Edit live whenever inspiration strikes
- Use the sync button periodically to keep local files updated
- The sync process is manual - you control when to update your repo
- Write in your natural voice - the editing preserves your style
- Use the tag system to categorize thoughts
- Timeline entries support multiple tags (comma separated)

Enjoy your new dynamic story page! 