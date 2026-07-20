1. The ethics/legal part (the real problem)

brias_interlude.mp3 is presumably a copyrighted song. Serving the full file from your own domain is unlicensed reproduction + distribution — the thing labels actually issue DMCA takedowns for. And committing it to a public git repo is worse: that's redistribution, permanently in history even after deletion.

Risk on a personal portfolio is low in practice, but it's not zero and it's not defensible. The reason the Spotify embed exists is that Spotify holds the licenses — that's why that path is "legal" and self-hosting isn't.

Clean options, roughly in order:
- Spotify/SoundCloud embed for real songs — licensed, zero liability. You lose the custom UI (audio's sandboxed in their iframe, as we found).
- Custom player, but only with audio you're allowed to serve — royalty-free/Creative Commons tracks (Uppbeat, Pixabay, Epidemic), or your own music. Best of both: your UI + no legal exposure.
- A short snippet (10–20s) reduces exposure but is still technically infringing — grey, not clean.

My recommendation: if you want the custom cream play button, feed it a licensed/CC track. If you specifically want this song, use the Spotify embed and skip the custom player for it.

2. The engineering part (regardless of source)

Even with a legal file, what we did isn't how you'd ship this:

- Don't commit audio to git. A 3 MB binary bloats every clone forever. Use Git LFS, or host the file on object storage/CDN (S3, Cloudflare R2, Vercel Blob) and reference the URL.
- preload="none", load on play. Right now preload="auto" downloads the whole MP3 on every page load whether or not anyone hits play — wasted bandwidth for most visitors.
- Normalize properly. I nudged it -10 dB by feel; the real tool is loudnorm (EBU R128) so it sits at a consistent perceived level instead of a guessed number.
- Right-size the encode. Background music doesn't need 184 kbps stereo — 96–128 kbps mono is transparent and ~half the bytes. Or use a short seamless loop instead of the full 2:19.
