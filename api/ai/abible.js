// api/abible.js

module.exports = {
  meta: {
    name: "Bible Verse",
    description: "Get a Bible verse based on a topic query",
    author: "Jaybohol",
    version: "2.0.0",
    category: "religion",
    method: "GET",
    path: "/abible?q="
  },

  onStart: async function({ req, res }) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          error: "Missing query parameter. Usage: /abible?q=love"
        });
      }

      const verse = await getVerseByTopic(q.trim());
      res.send(verse);

    } catch (error) {
      console.error("Bible API Error:", error.message);
      res.status(500).send("Error fetching Bible verse");
    }
  }
};

async function getVerseByTopic(topic) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a Bible verse assistant. When given a topic or keyword, respond with a single relevant Bible verse.

Format your response EXACTLY like this — nothing else:
[Book Chapter:Verse]
"[Verse text]"

Rules:
- Output ONLY the reference and verse. No intro, no explanation, no extra text.
- Use a well-known English Bible translation (NIV preferred).
- Choose the most relevant and meaningful verse for the topic.
- If the topic is vague or unusual, pick a broadly applicable verse.`,
      messages: [
        { role: "user", content: topic }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  const text = data.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();

  return text;
}
