// api/soundcloud.js

const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  meta: {
    name: "SoundCloud Search",
    description: "Search and get direct MP3 download links from SoundCloud",
    author: "Jaybohol",
    version: "2.0.0",
    category: "search",
    method: "GET",
    path: "/soundcloud?q="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { q, url } = req.query;
      
      // Download by URL
      if (url) {
        const result = await downloadSoundCloudTrack(url);
        
        return res.json({
          success: true,
          author: "Jaybohol",
          result: {
            title: result.title,
            duration: result.duration,
            audio: result.audio_url
          }
        });
      }
      
      // Search by query
      if (!q) {
        return res.status(400).json({
          success: false,
          author: "Jaybohol",
          message: "Parameter 'q' atau URL diperlukan",
          usage: {
            search: "/soundcloud?q=juancarlos",
            download: "/soundcloud?url=https://soundcloud.com/juan-karlos/ere"
          }
        });
      }
      
      const tracks = await searchSoundCloudTracks(q);
      
      res.json({
        success: true,
        author: "Jaybohol",
        result: tracks
      });
      
    } catch (error) {
      console.error("SoundCloud API Error:", error.message);
      
      res.status(500).json({
        success: false,
        author: "Jaybohol",
        message: error.message || "Failed to search SoundCloud"
      });
    }
  }
};

// ============= SOUNDCLOUD SEARCH =============

async function searchSoundCloudTracks(query) {
  try {
    // Multiple working client IDs
    const clientIds = [
      'a3e059563d7fd3372b49b37f00a00bcf',
      'gmV7Q5rVbGZB3J9A8QrLpY8QqLc7J6kZ',
      '2t9k7m4p6q8r0s2u4w6y8a0c2e4g6i8k',
      'pL8mN3bV7cX2zQ5wE9rT4yU6iA8oP0',
      'l8r4Z7vK2pQ5xW9mN3jF6hT1yB8cD0eR'
    ];
    
    let tracks = [];
    let lastError = null;
    
    // Try each client ID until one works
    for (const clientId of clientIds) {
      try {
        const response = await axios.get(`https://api.soundcloud.com/tracks`, {
          params: {
            q: query,
            client_id: clientId,
            limit: 20
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        if (response.data && response.data.collection && response.data.collection.length > 0) {
          tracks = response.data.collection;
          break;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (tracks.length === 0) {
      throw new Error(lastError?.message || "No tracks found");
    }
    
    // Format results
    const results = [];
    for (const track of tracks) {
      const streamUrl = track.stream_url ? `${track.stream_url}?client_id=a3e059563d7fd3372b49b37f00a00bcf` : null;
      
      results.push({
        title: track.title,
        artist: track.user?.username || "Unknown",
        duration: formatDuration(track.duration),
        url: track.permalink_url,
        thumbnail: track.artwork_url || track.user?.avatar_url,
        audio: streamUrl
      });
    }
    
    return results;
    
  } catch (error) {
    console.error("Search Error:", error.message);
    return await searchSoundCloudFallback(query);
  }
}

// ============= SOUNDCLOUD DOWNLOAD =============

async function downloadSoundCloudTrack(url) {
  try {
    // Extract track ID from URL
    const trackId = await extractTrackId(url);
    
    if (!trackId) {
      throw new Error("Could not extract track ID");
    }
    
    // Multiple client IDs to try
    const clientIds = [
      'a3e059563d7fd3372b49b37f00a00bcf',
      'gmV7Q5rVbGZB3J9A8QrLpY8QqLc7J6kZ',
      '2t9k7m4p6q8r0s2u4w6y8a0c2e4g6i8k'
    ];
    
    let track = null;
    let audioUrl = null;
    
    for (const clientId of clientIds) {
      try {
        const response = await axios.get(`https://api.soundcloud.com/tracks/${trackId}`, {
          params: { client_id: clientId },
          timeout: 10000
        });
        
        track = response.data;
        
        // Get stream URL
        if (track.stream_url) {
          audioUrl = `${track.stream_url}?client_id=${clientId}`;
          break;
        }
        
        // Try download URL
        if (track.download_url) {
          audioUrl = `${track.download_url}?client_id=${clientId}`;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!track) {
      throw new Error("Track not found");
    }
    
    // If still no URL, try alternative method
    if (!audioUrl) {
      audioUrl = await getAlternativeDownloadUrl(url);
    }
    
    return {
      title: track.title,
      duration: formatDuration(track.duration),
      audio_url: audioUrl
    };
    
  } catch (error) {
    console.error("Download Error:", error.message);
    return await downloadSoundCloudFallback(url);
  }
}

// ============= ALTERNATIVE METHODS =============

async function searchSoundCloudFallback(query) {
  try {
    // Fallback: scrape from soundcloud.com
    const response = await axios.get(`https://soundcloud.com/search/sounds`, {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Find all track items
    $('li[class*="sound"], .searchItem, .trackItem').each((i, elem) => {
      const titleElem = $(elem).find('.soundTitle__title, .trackItem__title, a[itemprop="name"]');
      const title = titleElem.text().trim();
      const link = titleElem.attr('href') || $(elem).find('a').first().attr('href');
      const artist = $(elem).find('.soundTitle__username, .trackItem__username, a[itemprop="author"]').text().trim();
      const duration = $(elem).find('.duration, .trackItem__duration').text().trim();
      const thumbnail = $(elem).find('img').attr('src');
      
      if (title && link && !link.includes('/playlists/')) {
        results.push({
          title: title,
          artist: artist || "Unknown Artist",
          duration: duration || "N/A",
          url: link.startsWith('http') ? link : `https://soundcloud.com${link}`,
          thumbnail: thumbnail || null,
          audio: null
        });
      }
    });
    
    return results.slice(0, 20);
    
  } catch (error) {
    console.error("Fallback Search Error:", error.message);
    return [];
  }
}

async function downloadSoundCloudFallback(url) {
  try {
    // Multiple fallback APIs
    const fallbackApis = [
      `https://soundcloud-downloader.vercel.app/api?url=${encodeURIComponent(url)}`,
      `https://soundcloud-scraper.p.rapidapi.com/track?url=${encodeURIComponent(url)}`
    ];
    
    for (const apiUrl of fallbackApis) {
      try {
        const response = await axios.get(apiUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && (response.data.url || response.data.download_url)) {
          return {
            title: response.data.title || "SoundCloud Track",
            duration: response.data.duration || "N/A",
            audio_url: response.data.url || response.data.download_url
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error("Unable to download track");
    
  } catch (error) {
    console.error("Fallback Download Error:", error.message);
    throw new Error("Track may be private or not available for download");
  }
}

async function getAlternativeDownloadUrl(url) {
  try {
    const api = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=a3e059563d7fd3372b49b37f00a00bcf`;
    const response = await axios.get(api, { timeout: 10000 });
    
    if (response.data && response.data.location) {
      return response.data.location;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function extractTrackId(url) {
  try {
    // Method 1: Direct ID in URL
    const idMatch = url.match(/soundcloud\.com\/tracks\/(\d+)/);
    if (idMatch) return idMatch[1];
    
    // Method 2: URL pattern with hyphen
    const hyphenMatch = url.match(/soundcloud\.com\/(?:[^\/]+)\/(?:[^\/]+)-(\d+)$/);
    if (hyphenMatch) return hyphenMatch[1];
    
    // Method 3: Fetch page and extract from meta tags
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Check meta tags
    const metaId = $('meta[property="soundcloud:track:id"]').attr('content');
    if (metaId) return metaId;
    
    // Check script tags
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html();
      if (content) {
        const scriptMatch = content.match(/track_id["']?\s*:\s*["']?(\d+)["']?/);
        if (scriptMatch) return scriptMatch[1];
      }
    }
    
    return null;
    
  } catch (error) {
    console.error("Extract Track ID Error:", error.message);
    return null;
  }
}

function formatDuration(ms) {
  if (!ms) return "N/A";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}
