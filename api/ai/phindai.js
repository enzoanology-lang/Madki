// api/phind.js

const axios = require("axios");
const crypto = require("crypto");

module.exports = {
  meta: {
    name: "Phind AI",
    description: "Ask questions to Phind AI - smart search and answer engine",
    author: "Jaybohol",
    version: "1.0.0",
    category: "ai",
    method: "POST",
    path: "/phind"
  },
  
  onStart: async function({ req, res }) {
    try {
      const { question, options, context, uid } = req.body;
      
      if (!question) {
        return res.status(400).json({
          status: false,
          operator: "JayBohol",
          author: "Jaybohol",
          error: "Question is required",
          usage: {
            method: "POST",
            body: {
              question: "Your question here",
              uid: "user123 (optional)",
              options: {
                language: "en",
                detailed: true
              }
            },
            example: {
              question: "What is artificial intelligence?"
            }
          }
        });
      }
      
      console.log(`🤖 Phind AI Request: "${question.substring(0, 50)}..."`);
      
      // Generate challenge number (anti-fraud)
      const challenge = Math.floor(Math.random() * 1000000);
      
      // Prepare payload
      const payload = {
        question: question,
        options: options || {
          date: new Date().toISOString().split('T')[0],
          language: "en",
          detailed: true,
          creative: false
        },
        context: context || [],
        challenge: challenge
      };
      
      const headers = {
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://www.phind.com",
        "Referer": "https://www.phind.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
      };
      
      const response = await axios.post(
        "https://https.api.phind.com/infer/",
        payload,
        { headers, timeout: 60000 }
      );
      
      let answer = "";
      let sources = [];
      let followUpQuestions = [];
      
      if (response.data) {
        answer = response.data.answer || response.data.message || response.data.response || "No response received";
        sources = response.data.sources || response.data.references || [];
        followUpQuestions = response.data.follow_up_questions || [];
      }
      
      // Clean up answer
      answer = answer.replace(/\*\*/g, '');
      answer = answer.trim();
      
      res.json({
        status: true,
        operator: "JayBohol",
        author: "Jaybohol",
        result: {
          question: question,
          answer: answer,
          sources: sources,
          follow_up_questions: followUpQuestions,
          uid: uid || "anonymous"
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Phind AI Error:", error.message);
      
      res.status(500).json({
        status: false,
        operator: "JayBohol",
        author: "Jaybohol",
        error: error.message || "Failed to get Phind AI response",
        details: error.response?.data
      });
    }
  }
};
