// ═══════════════════════════════════════════════════════════════════
// instagramScraper.js  —  Multi-method Instagram data fetcher
// Works on residential IPs (local dev machine / cheap VPS)
//
// METHOD CHAIN (fastest → most reliable):
//   1. Direct Instagram Internal API  (axios + proper headers)
//   2. Playwright + Stealth Browser   (intercepts real API calls)
//   3. Python Instaloader subprocess  (very reliable backup)
//   4. Smart estimation               (never fails)
// ═══════════════════════════════════════════════════════════════════
const axios        = require('axios');
const { execFile, exec } = require('child_process');
const path         = require('path');
const fs           = require('fs');
const os           = require('os');

// ─── Shared helpers ────────────────────────────────────────────────
function extractUsername(input) {
  if (!input) return null;
  input = input.trim().replace(/\/$/, '');
  const urlMatch   = input.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  if (urlMatch) return urlMatch[1];
  const plainMatch = input.match(/^@?([A-Za-z0-9._]+)$/);
  return plainMatch ? plainMatch[1] : null;
}

// Realistic Chrome/Mac headers that Instagram accepts
function igHeaders(username) {
  return {
    'User-Agent':       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':           '*/*',
    'Accept-Language':  'en-US,en;q=0.9,hi;q=0.8',
    'Accept-Encoding':  'gzip, deflate, br',
    'x-ig-app-id':      '936619743392459',
    'x-requested-with': 'XMLHttpRequest',
    'x-asbd-id':        '129477',
    'x-ig-www-claim':   '0',
    'Origin':           'https://www.instagram.com',
    'Referer':          `https://www.instagram.com/${username}/`,
    'Sec-Fetch-Dest':   'empty',
    'Sec-Fetch-Mode':   'cors',
    'Sec-Fetch-Site':   'same-origin',
    'sec-ch-ua':        '"Chromium";v="124", "Google Chrome";v="124"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  };
}

// Normalise any Instagram API response into a flat object
function normaliseIgResponse(raw) {
  // Multiple response shapes Instagram has used across versions
  const d =
    raw?.data?.user       ||   // v1 shape
    raw?.graphql?.user    ||   // legacy shape
    raw?.data             ||   // some v2 shapes
    raw;

  const followers  = d?.edge_followed_by?.count  ?? d?.follower_count  ?? d?.followers_count ?? null;
  const following  = d?.edge_follow?.count        ?? d?.following_count ?? d?.following       ?? 0;
  const mediaCount = d?.edge_owner_to_timeline_media?.count ?? d?.media_count ?? 0;

  if (followers === null) return null;   // couldn't parse

  return {
    followers:  parseInt(followers),
    following:  parseInt(following),
    mediaCount: parseInt(mediaCount),
    fullName:   d?.full_name   || d?.name         || '',
    biography:  d?.biography   || d?.bio          || '',
    profilePic: d?.profile_pic_url_hd || d?.profile_pic_url || '',
    isVerified: d?.is_verified || false,
    isPrivate:  d?.is_private  || false,
    username:   d?.username    || '',
  };
}

// ══════════════════════════════════════════════════════════════════
// METHOD 1 — Direct Instagram internal API (axios)
// Works on residential IPs. Fast (~1s). No browser needed.
// ══════════════════════════════════════════════════════════════════
async function method1_directAPI(username) {
  const endpoints = [
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: igHeaders(username),
        timeout: 10000,
        maxRedirects: 3,
      });
      const parsed = normaliseIgResponse(res.data);
      if (parsed && parsed.followers > 0) {
        console.log('[IG Method 1] ✅ Direct API success');
        return parsed;
      }
    } catch (e) {
      console.log(`[IG Method 1] ✗ ${url}: ${e.response?.status || e.message}`);
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════
// METHOD 2 — Playwright + Stealth (Real Chromium browser)
// Most reliable. Intercepts Instagram's own API calls.
// Requires: npm install playwright playwright-extra puppeteer-extra-plugin-stealth
//           npx playwright install chromium
// ══════════════════════════════════════════════════════════════════
async function method2_playwright(username) {
  let playwright_extra;
  try {
    playwright_extra = require('playwright-extra');
  } catch {
    console.log('[IG Method 2] playwright-extra not installed, skipping');
    return null;
  }

  let StealthPlugin;
  try {
    StealthPlugin = require('puppeteer-extra-plugin-stealth');
  } catch {
    console.log('[IG Method 2] stealth plugin not installed, skipping');
    return null;
  }

  console.log('[IG Method 2] Launching stealth browser...');
  const { chromium } = playwright_extra;
  chromium.use(StealthPlugin());

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800',
      ],
    });

    const context = await browser.newContext({
      viewport:          { width:1280, height:800 },
      userAgent:         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale:            'en-US',
      timezoneId:        'Asia/Kolkata',
      deviceScaleFactor: 1,
      hasTouch:          false,
      isMobile:          false,
    });

    const page = await context.newPage();

    // ── Intercept Instagram's own API calls ──────────────────────
    let profileData  = null;
    let postsData    = null;

    await page.route('**/*', async route => {
      const url = route.request().url();

      // Capture profile info API
      if (url.includes('web_profile_info') || url.includes('/users/') && url.includes('web_profile')) {
        const res = await route.fetch();
        try {
          const json = await res.json();
          const parsed = normaliseIgResponse(json);
          if (parsed) profileData = parsed;
        } catch {}
        return route.fulfill({ response: res });
      }

      // Capture posts/media GraphQL calls
      if ((url.includes('graphql/query') || url.includes('/api/v1/feed/user/')) && !postsData) {
        const res = await route.fetch();
        try {
          const json = await res.json();
          // Various shapes for posts data
          const edges =
            json?.data?.user?.edge_owner_to_timeline_media?.edges ||
            json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection?.edges ||
            json?.items ||
            [];
          if (edges.length > 0) {
            const posts = edges.slice(0, 12);
            const totals = posts.reduce((acc, edge) => {
              const n = edge?.node || edge;
              acc.likes    += parseInt(n?.edge_media_preview_like?.count || n?.like_count || 0);
              acc.comments += parseInt(n?.edge_media_to_comment?.count   || n?.comment_count || 0);
              acc.views    += parseInt(n?.video_view_count || n?.view_count || 0);
              return acc;
            }, { likes:0, comments:0, views:0 });
            postsData = {
              avgLikes:    Math.round(totals.likes    / posts.length),
              avgComments: Math.round(totals.comments / posts.length),
              avgViews:    Math.round(totals.views    / posts.length),
            };
          }
        } catch {}
        return route.fulfill({ response: res });
      }

      // Block unnecessary resources (images, fonts, media) for speed
      const type = route.request().resourceType();
      if (['image','media','font','stylesheet'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    // Navigate to profile
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'domcontentloaded',
      timeout:   25000,
    });

    // Wait a bit for async API calls
    await page.waitForTimeout(3000);

    // If interception didn't get profile, try scraping page JSON
    if (!profileData) {
      profileData = await page.evaluate(() => {
        try {
          // Try window.__additionalData
          const additional = window.__additionalData;
          if (additional) {
            const key = Object.keys(additional)[0];
            const data = additional[key]?.data?.user;
            if (data) return data;
          }
          // Try script tags with json
          const scripts = document.querySelectorAll('script[type="application/json"]');
          for (const s of scripts) {
            try {
              const json = JSON.parse(s.textContent);
              if (json?.props?.pageProps?.graphql?.user?.edge_followed_by) {
                return json.props.pageProps.graphql.user;
              }
            } catch {}
          }
        } catch {}
        return null;
      });
      if (profileData) profileData = normaliseIgResponse(profileData);
    }

    await browser.close();

    if (profileData) {
      console.log('[IG Method 2] ✅ Playwright success —', profileData.followers, 'followers');
      return { ...profileData, postsData };
    }
    console.log('[IG Method 2] ✗ Could not extract profile data from page');
    return null;

  } catch (err) {
    console.error('[IG Method 2] Playwright error:', err.message);
    if (browser) await browser.close().catch(() => {});
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// METHOD 3 — Python Instaloader subprocess
// Very reliable on residential IPs. Works without Instagram login.
// Requires: pip install instaloader
// ══════════════════════════════════════════════════════════════════

// Write the Python helper script to disk (once)
const INSTALOADER_SCRIPT = path.join(os.tmpdir(), 'ck_instaloader.py');
const INSTALOADER_CODE = `
import sys, json
try:
    import instaloader
except ImportError:
    print(json.dumps({"error": "instaloader not installed"}))
    sys.exit(0)

username = sys.argv[1]
L = instaloader.Instaloader(
    download_pictures=False,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
    quiet=True,
    max_connection_attempts=2,
)

try:
    profile = instaloader.Profile.from_username(L.context, username)
    
    # Get recent posts for real engagement data
    avg_likes = 0
    avg_comments = 0
    avg_views = 0
    post_count = 0
    try:
        recent = list(profile.get_posts())[:12]
        if recent:
            post_count = len(recent)
            avg_likes    = sum(p.likes    for p in recent) // post_count
            avg_comments = sum(p.comments for p in recent) // post_count
            avg_views    = sum(getattr(p, 'video_view_count', 0) or 0 for p in recent) // post_count
    except Exception:
        pass

    result = {
        "success": True,
        "followers":    profile.followers,
        "following":    profile.followees,
        "media_count":  profile.mediacount,
        "full_name":    profile.full_name,
        "biography":    profile.biography,
        "profile_pic":  profile.profile_pic_url,
        "is_verified":  profile.is_verified,
        "is_private":   profile.is_private,
        "avg_likes":    avg_likes,
        "avg_comments": avg_comments,
        "avg_views":    avg_views,
        "post_count":   post_count,
    }
    print(json.dumps(result))

except instaloader.exceptions.ProfileNotExistsException:
    print(json.dumps({"error": "Profile not found: " + username}))
except instaloader.exceptions.PrivateProfileNotFollowedException:
    print(json.dumps({"error": "private", "private": True}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

function ensureInstaladerScript() {
  if (!fs.existsSync(INSTALOADER_SCRIPT)) {
    fs.writeFileSync(INSTALOADER_SCRIPT, INSTALOADER_CODE.trim());
  }
}

async function method3_instaloader(username) {
  ensureInstaladerScript();

  return new Promise((resolve) => {
    const python = process.platform === 'win32' ? 'python' : 'python3';

    execFile(python, [INSTALOADER_SCRIPT, username], {
      timeout: 45000,   // instaloader can be slow
      maxBuffer: 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) {
        console.log('[IG Method 3] ✗ instaloader subprocess error:', err.message.split('\n')[0]);
        return resolve(null);
      }
      try {
        const data = JSON.parse(stdout.trim());
        if (data.error) {
          if (data.private) {
            console.log('[IG Method 3] ✗ Private profile:', username);
          } else {
            console.log('[IG Method 3] ✗ instaloader error:', data.error);
          }
          return resolve(null);
        }
        if (data.success) {
          console.log('[IG Method 3] ✅ instaloader success —', data.followers, 'followers');
          return resolve({
            followers:  data.followers,
            following:  data.following,
            mediaCount: data.media_count,
            fullName:   data.full_name,
            biography:  data.biography,
            profilePic: data.profile_pic,
            isVerified: data.is_verified,
            isPrivate:  data.is_private,
            postsData: data.post_count > 0 ? {
              avgLikes:    data.avg_likes,
              avgComments: data.avg_comments,
              avgViews:    data.avg_views,
            } : null,
          });
        }
      } catch (parseErr) {
        console.log('[IG Method 3] ✗ JSON parse error');
      }
      resolve(null);
    });
  });
}

// ══════════════════════════════════════════════════════════════════
// METHOD 4 — Smart estimation (always works, deterministic)
// ══════════════════════════════════════════════════════════════════
function method4_estimate(username) {
  const seed = username.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0) >>> 0;
  const rnd  = (mn, mx) => mn + ((seed * 9301 + 49297) % 233280) / 233280 * (mx - mn);

  const followers  = Math.round(rnd(8_000, 300_000));
  const er         = parseFloat(rnd(2, 7.5).toFixed(2));
  const avgLikes   = Math.round(followers * (er / 100));
  const avgComments= Math.round(avgLikes  * rnd(0.03, 0.08));

  console.log('[IG Method 4] ⚠ Using smart estimation for @' + username);
  return {
    followers,
    following:  Math.round(rnd(500, followers * 0.7)),
    mediaCount: Math.round(rnd(50, 600)),
    fullName:   username,
    biography:  '',
    profilePic: '',
    isVerified: false,
    isPrivate:  false,
    postsData:  { avgLikes, avgComments, avgViews: Math.round(avgLikes * 2.5) },
    _isEstimated: true,
  };
}

// ══════════════════════════════════════════════════════════════════
// MASTER FUNCTION — tries all methods in order
// ══════════════════════════════════════════════════════════════════
async function scrapeInstagram(input) {
  const username = extractUsername(input);
  if (!username) throw new Error('Invalid Instagram URL or username');

  // Try methods 1→3 in order. First success wins.
  const rawProfile =
    await method1_directAPI(username)  ||
    await method2_playwright(username) ||
    await method3_instaloader(username)||
    method4_estimate(username);

  const { postsData, ...profile } = rawProfile;

  // ── Build final engagement numbers ──────────────────────────────
  const followers = profile.followers || 0;

  let avgLikes, avgComments, avgViews;
  if (postsData && postsData.avgLikes > 0) {
    // Real data from posts
    avgLikes    = postsData.avgLikes;
    avgComments = postsData.avgComments;
    avgViews    = postsData.avgViews || Math.round(avgLikes * 2.5);
  } else {
    // Industry-benchmark estimates by follower tier
    const erPct = followers > 1_000_000 ? 1.5
                : followers > 500_000   ? 2.2
                : followers > 100_000   ? 3.0
                : followers > 50_000    ? 4.0
                : followers > 10_000    ? 5.5
                :                        7.0;
    avgLikes    = Math.round(followers * (erPct / 100));
    avgComments = Math.round(avgLikes * 0.05);
    avgViews    = Math.round(avgLikes * 2.5);
  }

  // Posts per week (from media count, assuming 2 years active)
  const postsPerWeek = Math.max(0.5, Math.min(7,
    parseFloat((profile.mediaCount / 104).toFixed(1))
  ));

  const er = followers > 0
    ? parseFloat(((avgLikes + avgComments) / followers * 100).toFixed(2))
    : 0;

  return {
    platform:    'instagram',
    username,
    fullName:    profile.fullName   || username,
    profilePic:  profile.profilePic || '',
    isVerified:  profile.isVerified || false,
    isPrivate:   profile.isPrivate  || false,
    followers,
    following:   profile.following  || 0,
    totalPosts:  profile.mediaCount || 0,
    avgLikes,
    avgComments,
    avgViews,
    er,
    postsPerWeek,
    isReal:      !rawProfile._isEstimated,
    _isEstimated: rawProfile._isEstimated || false,
  };
}

module.exports = { scrapeInstagram, extractUsername };
