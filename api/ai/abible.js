// api/abible.js

const axios = require('axios');

module.exports = {
  meta: {
    name: "Bible Verse",
    description: "Get a Bible verse based on a topic query using ChatGPT",
    author: "Jaybohol",
    version: "2.0.0",
    category: "religion",
    method: "GET",
    path: "/abible?q="
  },

  onStart: async function({ req, res }) {
    try {
      let { q, model = "chatgpt4" } = req.query;

      if (!q) {
        return res.status(400).json({
          error: "Missing query parameter. Usage: /abible?q=love"
        });
      }

      const modelList = {
        chatgpt4: {
          api: 'https://stablediffusion.fr/gpt4/predict2',
          referer: 'https://stablediffusion.fr/chatgpt4'
        },
        chatgpt3: {
          api: 'https://stablediffusion.fr/gpt3/predict',
          referer: 'https://stablediffusion.fr/chatgpt3'
        }
      };

      if (!modelList[model]) {
        return res.status(400).json({
          error: `Invalid model. Available models: ${Object.keys(modelList).join(', ')}`
        });
      }

      // System prompt for Bible verse assistant
      const systemPrompt = `You are a Bible verse assistant. When given a topic or keyword, respond with a single relevant Bible verse.

Format your response EXACTLY like this — nothing else:
[Book Chapter:Verse]
"[Verse text]"

Rules:
- Output ONLY the reference and verse. No intro, no explanation, no extra text.
- Use a well-known English Bible translation (NIV preferred).
- Choose the most relevant and meaningful verse for the topic.
- If the topic is vague or unusual, pick a broadly applicable verse.`;

      const fullPrompt = `${systemPrompt}\n\nTopic: ${q}\n\nVerse:`;

      // Get referer to receive cookies
      const refererResp = await axios.get(modelList[model].referer);
      const setCookie = refererResp.headers && refererResp.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : undefined;

      const { data } = await axios.post(
        modelList[model].api,
        { prompt: fullPrompt },
        {
          headers: {
            accept: '*/*',
            'content-type': 'application/json',
            origin: 'https://stablediffusion.fr',
            referer: modelList[model].referer,
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36'
          },
          timeout: 60000
        }
      );

      let answer = data.message || data.answer || "No response received";
      
      // Clean up the answer (remove any system prompt artifacts)
      answer = answer.replace(/^.*?Verse:\s*/i, '');
      answer = answer.trim();

      res.send(answer);

    } catch (error) {
      console.error("Bible API Error:", error.message);
      
      // Fallback response
      const fallback = getFallbackVerse(req.query.q);
      res.send(fallback);
    }
  }
};

function getFallbackVerse(topic) {
  const lowerTopic = (topic || "").toLowerCase();
  
  const verses = {
    lust: `Matthew 5:28\n"But I tell you that anyone who looks at a woman lustfully has already committed adultery with her in his heart."`,
    love: `John 3:16\n"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."`,
    faith: `Hebrews 11:1\n"Now faith is confidence in what we hope for and assurance about what we do not see."`,
    hope: `Jeremiah 29:11\n"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."`,
    prayer: `Philippians 4:6\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."`,
    forgiveness: `Ephesians 4:32\n"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you."`,
    fear: `Isaiah 41:10\n"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."`,
    peace: `John 14:27\n"Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."`,
    joy: `Nehemiah 8:10\n"The joy of the Lord is your strength."`,
    strength: `Philippians 4:13\n"I can do all this through him who gives me strength."`
  };
  
  for (const [key, value] of Object.entries(verses)) {
    if (lowerTopic.includes(key)) {
      return value;
    }
  }
  
  return `Psalm 119:105\n"Your word is a lamp for my feet, a light on my path."`;
}
