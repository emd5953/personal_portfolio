# Spotify Integration

## Overview
The app fetches your recent listening data to show:
- Last played song
- Most played song of the day (with play count) - **Story page only**
- 3 random daily playlists

**Note**: The Spotify widget (`/api/spotify-widget`) only shows last played song and featured playlist for simplicity.

## API Strategy

### Data Collection
- **Target**: ~100 recent tracks for analysis
- **Method**: Smart pagination (max 2 API calls)
- **Fallback**: Single call for light listeners

### Pagination Logic
```javascript
// First call: Get 50 most recent tracks
const firstResponse = await fetch('recently-played?limit=50');

// Second call: Only if needed
if (tracks.length === 50 && firstData.next) {
  const secondResponse = await fetch(firstData.next);
}
```

### When Second Call Happens
- ✅ First call returned exactly 50 tracks
- ✅ Spotify provided `next` URL (more data exists)
- ❌ Light listeners (< 50 tracks) skip second call

## Spotify's `next` Field
Spotify returns pagination URLs like:
```
https://api.spotify.com/v1/me/player/recently-played?limit=50&before=1641234567890
```

The `before` parameter ensures chronological order without duplicates.

## Most Played Logic
1. Filter tracks played today (since midnight)
2. Count plays per unique track ID
3. Show track with highest count (minimum 2 plays)
4. **Fallback**: If no repeats, show most recent song from today
5. Display with play count: "Most Played Today (3 plays)" or "Most Played Today (1 play)"

## Recent Fixes (Jan 2026)

### Issue: Most Played Today Not Appearing
**Problem**: Local server (`server.js`) was missing the "most played today" logic that existed in the Vercel serverless function (`api/spotify.js`).

**Root Cause**: 
- Server only fetched last played track (1 track)
- Missing the track counting and "most played" analysis
- Frontend expected `mostPlayedToday` field but server wasn't providing it

**Solution**:
1. **Added full most played logic to server.js**
   - Fetch up to 100 recent tracks (2 API calls if needed)
   - Filter tracks played today
   - Count plays per track
   - Find most played track

2. **Added fallback for music diversity**
   - If no songs played 2+ times today, show most recent song
   - Prevents empty "Most Played Today" section
   - Perfect for users with diverse listening habits

3. **Synchronized server.js with api/spotify.js**
   - Both now use identical logic
   - Consistent behavior between local dev and production

## Architecture
**Shared Logic**:
- `api/spotify-shared.js` - Contains all Spotify API logic (single source of truth)

**Environment-Specific Wrappers**:
- `server.js` - Local development wrapper (calls shared logic)
- `api/spotify.js` - Vercel serverless function wrapper (calls shared logic)

**Specialized Endpoints**:
- `api/spotify-widget.js` - Simplified widget version (last played + playlist only)

**Frontend**:
- `scripts/storyPage.js` - Same for both environments

### Benefits of Shared Architecture
1. **DRY (Don't Repeat Yourself)**: Logic exists in one place
2. **Consistency**: Both environments use identical logic  
3. **Maintainability**: Fix bugs once, applies everywhere
4. **Smaller files**: Each wrapper is minimal

### Workflow
- **Local**: `server.js` → `spotify-shared.js` → Spotify API
- **Production**: `api/spotify.js` → `spotify-shared.js` → Spotify API
- **Widget**: `api/spotify-widget.js` → Direct API calls (simplified)

### Technical Details
- **API Calls**: 1-2 calls to `/me/player/recently-played`
- **Data Range**: Up to 100 most recent tracks
- **Filtering**: Only tracks played since midnight (local time)
- **Fallback**: Most recent track if no repeats found

## Performance
- **Typical**: 1 API call (~200ms)
- **Heavy listeners**: 2 API calls (~400ms)
- **Original**: 1 call, 1 track (last played only)
- **Fixed**: 1-2 calls, 50-100 tracks (full analysis)