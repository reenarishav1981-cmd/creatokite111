// ═══════════════════════════════════════════════════════════════════
// socialFetcher.js  —  Main entry point for social data fetching
// Combines: instagramScraper (multi-method) + YouTube Data API
// ═══════════════════════════════════════════════════════════════════
const axios            = require('axios');
const { scrapeInstagram } = require('./instagramScraper');

// ─── YouTube ────────────────────────────────────────────────────────
async function resolveYouTubeChannelId(input, key) {
  input = input.trim().replace(/\/$/, '');
  if (/^UC[\w-]{22}$/.test(input)) return input;

  const chanMatch = input.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (chanMatch) return chanMatch[1];

  const handleMatch = input.match(/youtube\.com\/@([\w.-]+)/) || input.match(/^@([\w.-]+)/);
  const userMatch   = input.match(/youtube\.com\/(?:c\/|user\/)([\w.-]+)/);
  const query = handleMatch?.[1] || userMatch?.[1] ||
    input.replace(/https?:\/\/(www\.)?youtube\.com\/?/i, '').replace('@','').trim();

  try {
    const r = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part:'snippet', q:query, type:'channel', maxResults:1, key },
      timeout: 8000,
    });
    return r.data.items?.[0]?.snippet?.channelId || null;
  } catch { return null; }
}

async function fetchYouTube(input) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !input) return null;
  const YT = 'https://www.googleapis.com/youtube/v3';

  try {
    const channelId = await resolveYouTubeChannelId(input, key);
    if (!channelId) return null;

    const cr = await axios.get(`${YT}/channels`, {
      params: { part:'statistics,snippet,contentDetails', id:channelId, key },
      timeout: 8000,
    });
    const ch = cr.data.items?.[0];
    if (!ch) return null;

    const subscribers = parseInt(ch.statistics.subscriberCount || 0);
    const totalVideos  = parseInt(ch.statistics.videoCount     || 0);
    const uploadPL     = ch.contentDetails.relatedPlaylists?.uploads;

    let avgViews=0, avgLikes=0, avgComments=0, postsPerWeek=1;

    if (uploadPL) {
      const pr = await axios.get(`${YT}/playlistItems`, {
        params: { part:'contentDetails', playlistId:uploadPL, maxResults:15, key },
        timeout: 8000,
      });
      const ids = pr.data.items?.map(i => i.contentDetails.videoId).join(',');
      if (ids) {
        const vr = await axios.get(`${YT}/videos`, {
          params: { part:'statistics,snippet', id:ids, key },
          timeout: 8000,
        });
        const vids = vr.data.items || [];
        if (vids.length) {
          const tot = vids.reduce((a,v)=>({
            v: a.v+parseInt(v.statistics.viewCount    ||0),
            l: a.l+parseInt(v.statistics.likeCount    ||0),
            c: a.c+parseInt(v.statistics.commentCount ||0),
          }),{ v:0, l:0, c:0 });
          avgViews    = Math.round(tot.v/vids.length);
          avgLikes    = Math.round(tot.l/vids.length);
          avgComments = Math.round(tot.c/vids.length);
          const dates = vids.map(v=>new Date(v.snippet.publishedAt)).sort((a,b)=>a-b);
          if (dates.length>=2) {
            const wks=Math.max((dates[dates.length-1]-dates[0])/(1000*60*60*24*7),1);
            postsPerWeek=parseFloat((vids.length/wks).toFixed(2));
          }
        }
      }
    }

    const er = subscribers>0
      ? parseFloat(((avgLikes+avgComments)/subscribers*100).toFixed(2))
      : 0;

    return {
      platform:'youtube', channelId,
      channelTitle: ch.snippet.title,
      thumbnail:    ch.snippet.thumbnails?.medium?.url||'',
      followers: subscribers, subscribers,
      totalPosts: totalVideos,
      avgViews, avgLikes, avgComments, er, postsPerWeek,
      isReal: true,
    };
  } catch(err) {
    console.error('[YouTube] Fetch failed:', err.message);
    return null;
  }
}

// ─── Master export ──────────────────────────────────────────────────
async function fetchSocialData(instagramUrl, youtubeUrl) {
  const [ig, yt] = await Promise.allSettled([
    instagramUrl ? scrapeInstagram(instagramUrl) : Promise.resolve(null),
    youtubeUrl   ? fetchYouTube(youtubeUrl)      : Promise.resolve(null),
  ]);
  const igData = ig.status==='fulfilled' ? ig.value : null;
  const ytData = yt.status==='fulfilled' ? yt.value : null;

  if (igData) console.log(`[Social] Instagram @${igData.username}: ${igData.followers} followers, ${igData.er}% ER, real=${igData.isReal}`);
  if (ytData) console.log(`[Social] YouTube ${ytData.channelTitle}: ${ytData.subscribers} subs, ${ytData.er}% ER`);

  return { igData, ytData };
}

module.exports = { fetchSocialData };
