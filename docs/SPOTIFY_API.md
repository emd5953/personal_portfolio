# Spotify Integration

## Overview
The app fetches your recent listening data to show:
- Last played song
- Most played song of the day (with play count)
- 3 random daily playlists

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
4. Display with play count: "Most Played Today (3 plays)"

## Performance
- **Typical**: 1 API call (~200ms)
- **Heavy listeners**: 2 API calls (~400ms)
- **Original**: 1 call, 50 tracks
- **Now**: 1-2 calls, 50-100 tracks