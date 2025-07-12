const express = require("express");
const router = express.Router();
const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

router.post("/reply", async (req, res) => {
  const { message } = req.body;
  const lower = message.toLowerCase();
  if (lower.includes("human") || lower.includes("agent") || lower.includes("real person")) {
    return res.json({ reply: "I will connect you to a human support agent now." });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: "You are OmniChat, a customer support agent for a company. You must always act as a professional support agent. If the user asks for a human, you must reply: 'I will connect you to a human support agent now.' Never say you are an AI or chatbot. Only answer as a support agent." },
          { role: "user", content: message }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000", // required for free keys
          "X-Title": "OmniChat",
        },
      }
    );
    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

module.exports = router;