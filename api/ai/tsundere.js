// api/ai/tsundere.js

const axios = require("axios");
const crypto = require("crypto");

module.exports = {
  meta: {
    name: "Tsundere Text-to-Speech",
    description: "AI Voice with Tsundere style - converts text to speech with tsundere tone",
    author: "Jaybohol",
    version: "1.0.0",
    category: "ai",
    method: "GET",
    path: "/api/ai/tsundere?text="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { text, voice = "Kore", language = "id-ID", speed = 1.1, pitch = 2.5 } = req.query;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          author: "Jaybohol",
          message: "Parameter 'text' wajib diisi.",
          usage: "/api/ai/tsundere?text=Hello%20World"
        });
      }
      
      console.log(`🎙️ Generating Tsundere TTS for: "${text.substring(0, 50)}..."`);
      
      // Generate TTS audio
      const audioBuffer = await generateTsundereTTS(text, voice, language, parseFloat(speed), parseFloat(pitch));
      
      // Generate unique ID for the audio
      const audioId = generateAudioId(text);
      
      // Initialize cache if not exists
      if (!global.audioCache) {
        global.audioCache = new Map();
        console.log("📦 Created new audio cache");
      }
      
      // Store audio in cache
      global.audioCache.set(audioId, audioBuffer);
      console.log(`💾 Stored audio with ID: ${audioId}`);
      
      // Clean up after 5 minutes
      setTimeout(() => {
        if (global.audioCache && global.audioCache.has(audioId)) {
          global.audioCache.delete(audioId);
          console.log(`🗑️ Removed audio ${audioId} from cache`);
        }
      }, 5 * 60 * 1000);
      
      // Get the domain from the request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const audioUrl = `${protocol}://${host}/api/media/${audioId}`;
      
      console.log(`✅ Audio URL: ${audioUrl}`);
      
      res.json({
        success: true,
        author: "Jaybohol",
        result: {
          text: text,
          audio: audioUrl
        }
      });
      
    } catch (error) {
      console.error("Tsundere TTS Error:", error.message);
      
      res.status(500).json({
        success: false,
        author: "Jaybohol",
        message: error.message || "Failed to generate Tsundere TTS"
      });
    }
  }
};

// ============= HELPER FUNCTIONS =============

function generateFakeIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.');
}

function generateAudioId(text) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(`${text}${timestamp}`).digest('hex');
  return `${hash.substring(0, 32)}:${random.substring(0, 32)}`;
}

async function generateTsundereTTS(text, voice, language, speed, pitch) {
  const url = 'https://api.screenapp.io/v2/proxy/google/tts';
  const fakeIP = generateFakeIP();
  
  const payload = {
    "input": text,
    "model": "gemini-2.5-flash-tts",
    "voice": voice || "Kore",
    "language_code": language || "id-ID",
    "response_format": "mp3",
    "speaking_rate": speed || 1.1,
    "pitch": pitch || 2.5,
    "volume_gain_db": 0
  };
  
  const headers = {
    'authority': 'api.screenapp.io',
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://screenapp.io',
    'referer': 'https://screenapp.io/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    'x-forwarded-for': fakeIP,
    'client-ip': fakeIP,
    'via': '1.1 google'
  };
  
  try {
    const response = await axios({
      method: 'post',
      url: url,
      data: payload,
      headers: headers,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const audioBuffer = Buffer.from(response.data);
    
    if (audioBuffer.length < 1000) {
      throw new Error(`Generated audio too small: ${audioBuffer.length} bytes`);
    }
    
    console.log(`✅ Audio generated: ${audioBuffer.length} bytes`);
    return audioBuffer;
  } catch (error) {
    console.error("Tsundere TTS API Error:", error.message);
    
    if (error.response) {
      throw new Error(`TTS API Error: ${error.response.status}`);
    }
    throw new Error(error.message || 'Failed to generate Tsundere TTS');
  }
}
