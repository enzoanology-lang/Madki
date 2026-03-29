// api/biblegpt.js

const axios = require("axios");

module.exports = {
  meta: {
    name: "BibleGPT",
    description: "AI-powered tool that delivers accurate Bible-based answers to user queries",
    author: "Jaybohol",
    version: "1.0.0",
    category: "ai",
    method: "GET",
    path: "/biblegpt?q="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          author: "Jaybohol",
          message: "Please provide a question",
          usage: {
            example: "/biblegpt?q=What does John 3:16 mean?",
            examples: [
              "/biblegpt?q=Explain the story of David and Goliath",
              "/biblegpt?q=I'm lonely",
              "/biblegpt?q=What does the Bible say about love?"
            ]
          }
        });
      }
      
      // Get Bible-based response from Pollinations AI
      const response = await getBibleAIResponse(q);
      
      res.json({
        success: true,
        author: "Jaybohol",
        result: {
          answer: response.answer,
          verses: response.verses
        }
      });
      
    } catch (error) {
      console.error("BibleGPT Error:", error.message);
      
      res.status(500).json({
        success: false,
        author: "Jaybohol",
        message: error.message || "Failed to get Bible response"
      });
    }
  }
};

// ============= BIBLE AI RESPONSE GENERATOR =============

async function getBibleAIResponse(question) {
  try {
    // System prompt to make AI answer as a Bible expert
    const systemPrompt = `You are BibleGPT, an AI-powered tool that delivers accurate Bible-based answers to user queries. 
Your responses must be rooted in Biblical teachings and Scripture. Follow these guidelines:
- Always base your answers on the Bible
- Include relevant Bible verses when appropriate
- Be compassionate, encouraging, and helpful
- Explain biblical concepts clearly
- If someone shares pain or loneliness, respond with comfort from Scripture
- Keep responses warm, personal, and concise (2-4 paragraphs maximum)`;
    
    // Call Pollinations AI
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(question)}`, {
      params: {
        model: "openai",
        temperature: 0.7,
        system: systemPrompt
      },
      timeout: 30000
    });
    
    let answer = response.data;
    
    // Extract Bible verses from the response
    const verses = extractVerses(answer);
    
    // Clean up the answer
    answer = cleanAnswer(answer);
    
    return {
      answer: answer,
      verses: verses
    };
    
  } catch (error) {
    console.error("poli AI Error:", error.message);
    
    // Fallback responses if API fails
    return getFallbackResponse(question);
  }
}

// ============= HELPER FUNCTIONS =============

function extractVerses(text) {
  const verses = [];
  const versePattern = /\b([A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
  
  let match;
  while ((match = versePattern.exec(text)) !== null) {
    verses.push({
      reference: `${match[1]} ${match[2]}:${match[3]}`,
      book: match[1],
      chapter: parseInt(match[2]),
      verse: parseInt(match[3])
    });
  }
  
  // Remove duplicates
  return verses.filter((v, i, a) => 
    a.findIndex(t => t.reference === v.reference) === i
  );
}

function cleanAnswer(text) {
  text = text.replace(/\*\*/g, '');
  text = text.replace(/\*/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function getFallbackResponse(question) {
  const lowerQuestion = question.toLowerCase();
  
  // David and Goliath
  if (lowerQuestion.includes("david") && lowerQuestion.includes("goliath")) {
    return {
      answer: "The story of David and Goliath is found in 1 Samuel 17. The Philistine army had a champion giant named Goliath who challenged Israel for 40 days. While the Israelite soldiers were terrified, a young shepherd boy named David came to bring food to his brothers. David trusted God and volunteered to fight Goliath, not with armor and sword, but with his sling and five smooth stones. David declared to Goliath: 'You come against me with sword and spear, but I come against you in the name of the Lord Almighty' (1 Samuel 17:45). With one stone from his sling, David struck Goliath and defeated him. This story teaches us that God doesn't look at our size or strength—He looks at our faith. When we trust in God, He can use ordinary people to do extraordinary things. Whatever 'giants' you're facing today, remember that with God, you can overcome them.",
      verses: [{ reference: "1 Samuel 17", book: "1 Samuel", chapter: 17, verse: 45 }]
    };
  }
  
  // Loneliness
  if (lowerQuestion.includes("lonely") || lowerQuestion.includes("alone")) {
    return {
      answer: "I'm sorry you're feeling lonely. Please know that you are never truly alone. God promises in Deuteronomy 31:6: 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.' Jesus also said in Matthew 28:20, 'And surely I am with you always, to the very end of the age.' Loneliness is a human experience, but God's presence is constant. David wrote in Psalm 23:4, 'Even though I walk through the darkest valley, I will fear no evil, for you are with me.' In times of loneliness, reach out to God in prayer, connect with other believers, and remember that God's love for you is unchanging. You are seen, you are loved, and you are never alone.",
      verses: [
        { reference: "Deuteronomy 31:6", book: "Deuteronomy", chapter: 31, verse: 6 },
        { reference: "Matthew 28:20", book: "Matthew", chapter: 28, verse: 20 },
        { reference: "Psalm 23:4", book: "Psalm", chapter: 23, verse: 4 }
      ]
    };
  }
  
  // John 3:16
  if (lowerQuestion.includes("john 3:16")) {
    return {
      answer: "John 3:16 is one of the most beloved verses in the Bible: 'For God so loved the world that he gave his only Son, that whoever believes in him should not perish but have eternal life.' This verse captures the heart of the Gospel. It shows us three things: First, God's love is vast—He loves the entire world. Second, God's love is sacrificial—He gave His only Son. Third, God's love is personal—whoever believes will receive eternal life. This verse reminds us that salvation is not about what we do, but about trusting in what God has already done for us through Jesus. It's the good news that no matter who you are or what you've done, God's love reaches you.",
      verses: [{ reference: "John 3:16", book: "John", chapter: 3, verse: 16 }]
    };
  }
  
  // Love
  if (lowerQuestion.includes("love")) {
    return {
      answer: "The Bible has much to say about love. 1 Corinthians 13:4-7 describes love: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.' The greatest commandment is to love God with all your heart and to love your neighbor as yourself (Matthew 22:37-39). And 1 John 4:8 tells us that 'God is love.' Love isn't just a feeling—it's an action, a choice, and ultimately it's found in God's character. When we love others, we reflect God's heart to the world.",
      verses: [
        { reference: "1 Corinthians 13:4-7", book: "1 Corinthians", chapter: 13, verse: 4 },
        { reference: "Matthew 22:37-39", book: "Matthew", chapter: 22, verse: 37 },
        { reference: "1 John 4:8", book: "1 John", chapter: 4, verse: 8 }
      ]
    };
  }
  
  // Faith
  if (lowerQuestion.includes("faith")) {
    return {
      answer: "Faith is central to the Christian life. Hebrews 11:1 defines faith as 'the assurance of things hoped for, the conviction of things not seen.' It's trusting God even when we can't see the outcome. Ephesians 2:8-9 reminds us that we are saved by grace through faith—it's a gift from God, not something we earn. Faith grows through hearing God's Word (Romans 10:17) and through trials that develop perseverance (James 1:2-4). Examples of faith in the Bible include Abraham, who trusted God's promises; Moses, who chose to follow God; and David, who trusted God against Goliath. Faith isn't the absence of doubt—it's choosing to trust God despite uncertainty.",
      verses: [
        { reference: "Hebrews 11:1", book: "Hebrews", chapter: 11, verse: 1 },
        { reference: "Ephesians 2:8-9", book: "Ephesians", chapter: 2, verse: 8 },
        { reference: "Romans 10:17", book: "Romans", chapter: 10, verse: 17 }
      ]
    };
  }
  
  // Prayer
  if (lowerQuestion.includes("pray")) {
    return {
      answer: "Prayer is simply talking to God. Jesus taught His disciples to pray in Matthew 6:9-13: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done, on earth as it is in heaven. Give us today our daily bread. And forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from the evil one.' The Bible encourages us to 'pray without ceasing' (1 Thessalonians 5:17) and to bring everything to God in prayer with thanksgiving (Philippians 4:6). There's no wrong way to pray—just come to God honestly, with an open heart. He listens, He cares, and He answers in His perfect timing and wisdom.",
      verses: [
        { reference: "Matthew 6:9-13", book: "Matthew", chapter: 6, verse: 9 },
        { reference: "1 Thessalonians 5:17", book: "1 Thessalonians", chapter: 5, verse: 17 },
        { reference: "Philippians 4:6", book: "Philippians", chapter: 4, verse: 6 }
      ]
    };
  }
  
  // Hope
  if (lowerQuestion.includes("hope")) {
    return {
      answer: "Hope in the Bible is not wishful thinking—it's confident expectation in God's promises. Jeremiah 29:11 says, 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' Romans 15:13 offers a beautiful blessing: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.' Our hope is anchored in God's character—He is faithful, He keeps His promises, and He is working all things for our good (Romans 8:28). No matter how dark circumstances seem, hope reminds us that God is still on the throne and His plans for us are good.",
      verses: [
        { reference: "Jeremiah 29:11", book: "Jeremiah", chapter: 29, verse: 11 },
        { reference: "Romans 15:13", book: "Romans", chapter: 15, verse: 13 },
        { reference: "Romans 8:28", book: "Romans", chapter: 8, verse: 28 }
      ]
    };
  }
  
  // Peace
  if (lowerQuestion.includes("peace")) {
    return {
      answer: "God offers a peace that surpasses human understanding. Jesus said in John 14:27, 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.' Philippians 4:6-7 teaches, 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' This peace isn't dependent on circumstances—it comes from trusting that God is in control and that He cares for you. When you give your worries to God, He replaces anxiety with His peace.",
      verses: [
        { reference: "John 14:27", book: "John", chapter: 14, verse: 27 },
        { reference: "Philippians 4:6-7", book: "Philippians", chapter: 4, verse: 6 }
      ]
    };
  }
  
  // Default response
  return {
    answer: "Thank you for your question. The Bible has wisdom for every area of life. To give you the most helpful answer, I encourage you to ask about a specific verse (like 'John 3:16'), a biblical theme (like 'faith' or 'love'), or a Bible story (like 'David and Goliath'). The Bible says in 2 Timothy 3:16-17 that 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.' I'm here to help you explore God's Word—what would you like to know?",
    verses: [{ reference: "2 Timothy 3:16-17", book: "2 Timothy", chapter: 3, verse: 16 }]
  };
}
