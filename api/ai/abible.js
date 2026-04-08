// api/abible.js

const axios = require("axios");

// Store used verses per topic to avoid repeats
const usedVerses = new Map();

module.exports = {
  meta: {
    name: "Bible Verse",
    description: "Get a unique Bible verse based on a topic using AI",
    author: "Jaybohol",
    version: "3.0.0",
    category: "ai",
    method: "GET",
    path: "/abible?q="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).send("Missing query parameter. Usage: /abible?q=lust");
      }
      
      const topic = q.toLowerCase().trim();
      
      // Initialize used verses for this topic if not exists
      if (!usedVerses.has(topic)) {
        usedVerses.set(topic, []);
      }
      
      const usedList = usedVerses.get(topic);
      
      // Get a new unique Bible verse
      const verse = await getUniqueBibleVerse(topic, usedList);
      
      // Add to used list
      usedList.push(verse);
      usedVerses.set(topic, usedList);
      
      res.setHeader('Content-Type', 'text/plain');
      res.send(verse);
      
    } catch (error) {
      console.error("Bible API Error:", error.message);
      
      // Fallback local verse if AI fails
      const fallbackVerse = getFallbackVerse(req.query.q);
      res.setHeader('Content-Type', 'text/plain');
      res.send(fallbackVerse);
    }
  }
};

async function getUniqueBibleVerse(topic, usedList) {
  const systemPrompt = `You are a Bible verse assistant. When given a topic or keyword, respond with a single relevant Bible verse.

Format your response EXACTLY like this — nothing else:
[Book Chapter:Verse]
"[Verse text]"

Rules:
- Output ONLY the reference and verse. No intro, no explanation, no extra text.
- Use a well-known English Bible translation (NIV preferred).
- Use also Filipino or Cebuano language if the topic is in Tagalog or Cebuano.
- Choose the most relevant and meaningful verse for the topic.
- If the topic is vague or unusual, pick a broadly applicable verse.
- IMPORTANT: Do NOT use any of these verses that have already been given: ${usedList.join(', ') || 'none yet'}
- Find a DIFFERENT verse about the same topic that hasn't been used before.
- If all verses about this topic have been used, start over from the beginning with the first verse again.`;

  const fullPrompt = `${systemPrompt}\n\nTopic: ${topic}\n\nVerse:`;

  // Try Pollinations AI
  try {
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`, {
      params: {
        model: "openai",
        temperature: 0.7
      },
      timeout: 30000
    });
    
    let verse = response.data;
    
    // Clean up the response
    verse = verse.replace(/\*\*/g, '');
    verse = verse.replace(/```/g, '');
    verse = verse.trim();
    
    // Validate it looks like a Bible verse
    if (verse.match(/[A-Za-z]+\s+\d+:\d+/) || verse.match(/[A-Za-z]+\s+\d+:\d+-\d+/)) {
      return verse;
    }
    
    return verse;
    
  } catch (error) {
    console.error(" Error:", error.message);
    throw error;
  }
}

function getFallbackVerse(topic) {
  const lowerTopic = topic.toLowerCase();
  
  // Comprehensive verse database
  const verses = {
    lust: [
      `Matthew 5:28\n"But I tell you that anyone who looks at a woman lustfully has already committed adultery with her in his heart."`,
      `1 John 2:16\n"For everything in the world—the lust of the flesh, the lust of the eyes, and the pride of life—comes not from the Father but from the world."`,
      `Galatians 5:16\n"So I say, walk by the Spirit, and you will not gratify the desires of the flesh."`,
      `James 1:14-15\n"But each person is tempted when they are dragged away by their own evil desire and enticed. Then, after desire has conceived, it gives birth to sin; and sin, when it is full-grown, gives birth to death."`,
      `1 Peter 2:11\n"Dear friends, I urge you, as foreigners and exiles, to abstain from sinful desires, which wage war against your soul."`,
      `Colossians 3:5\n"Put to death, therefore, whatever belongs to your earthly nature: sexual immorality, impurity, lust, evil desires and greed, which is idolatry."`,
      `Romans 13:14\n"Rather, clothe yourselves with the Lord Jesus Christ, and do not think about how to gratify the desires of the flesh."`,
      `2 Timothy 2:22\n"Flee the evil desires of youth and pursue righteousness, faith, love and peace, along with those who call on the Lord out of a pure heart."`
    ],
    love: [
      `John 3:16\n"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."`,
      `1 Corinthians 13:4-7\n"Love is patient, love is kind. It does not envy, it does not boast, it is not proud."`,
      `1 John 4:8\n"Whoever does not love does not know God, because God is love."`,
      `Romans 13:10\n"Love does no harm to a neighbor. Therefore love is the fulfillment of the law."`,
      `1 Peter 4:8\n"Above all, love each other deeply, because love covers over a multitude of sins."`,
      `Colossians 3:14\n"And over all these virtues put on love, which binds them all together in perfect unity."`
    ],
    faith: [
      `Hebrews 11:1\n"Now faith is confidence in what we hope for and assurance about what we do not see."`,
      `Ephesians 2:8-9\n"For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast."`,
      `2 Corinthians 5:7\n"For we live by faith, not by sight."`,
      `Romans 10:17\n"Consequently, faith comes from hearing the message, and the message is heard through the word about Christ."`,
      `James 2:17\n"In the same way, faith by itself, if it is not accompanied by action, is dead."`
    ],
    hope: [
      `Jeremiah 29:11\n"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."`,
      `Romans 15:13\n"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."`,
      `Psalm 39:7\n"But now, Lord, what do I look for? My hope is in you."`,
      `Hebrews 11:1\n"Now faith is confidence in what we hope for and assurance about what we do not see."`
    ]
  };
  
  // Get verses for topic or default
  let topicVerses = verses[lowerTopic];
  if (!topicVerses) {
    topicVerses = [
      `Psalm 119:105\n"Your word is a lamp for my feet, a light on my path."`,
      `Romans 8:28\n"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."`,
      `Philippians 4:13\n"I can do all this through him who gives me strength."`
    ];
  }
  
  // Get used verses from memory or initialize
  if (!global.fallbackUsedVerses) {
    global.fallbackUsedVerses = new Map();
  }
  
  let usedList = global.fallbackUsedVerses.get(lowerTopic) || [];
  
  // Get next verse (cycle through)
  let nextIndex = usedList.length % topicVerses.length;
  let verse = topicVerses[nextIndex];
  
  // Mark as used
  usedList.push(verse);
  global.fallbackUsedVerses.set(lowerTopic, usedList);
  
  return verse;
}
