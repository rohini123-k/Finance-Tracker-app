const express = require("express");
const axios = require("axios");

const router = express.Router();

// Use environment variable for Gemini API Key
const GEMINI_API_KEY = process.env.OPENAI_API_KEY|| "YOUR_FALLBACK_KEY";

// Enhanced predefined finance responses
const responses = {
  hi: "Hello! I'm your personal finance assistant. How can I help you manage your money better today?",
  hello: "Hi there! I'm here to help with all your finance questions. What would you like to know?",
  // income: "Your total income this month is ₹80.00.",
  expenses: "Your total expenses this month are ₹35%.",
  budget: "You have used 25% of your monthly budget (₹20,000 out of ₹80,000). You're doing great with your spending control!",
  // savings: "Your total savings balance is ₹3,50,000.",
  // investment: "You have invested ₹5,00,000 across stocks, mutual funds, and FD.",
  // insurance: "Your life insurance cover is ₹50,00,000 with a yearly premium of ₹12,000.",
  bills: "Your electricity bill is ₹2,000 and internet bill is ₹1,000.",
  loan: "Your outstanding home loan is ₹10,00,000 with a monthly EMI of ₹25,000.",
  tax: "Your estimated income tax for this year is ₹15,000.",
  credit: "Your current credit card balance is ₹12,000 with a due date on 25th of this month.",
  retirement: "You have ₹2,00,000 in your retirement fund.",
  emergency_fund: "Your emergency fund balance is ₹50,000.",
  help: "I can help you with: Income tracking, Expense management, Budget planning, Investment advice, Insurance queries, Loan calculations, Tax planning, Credit card management, Retirement planning, and Emergency fund guidance. What would you like to know?"
};

// Function to create enhanced prompts for Gemini
function createGeminiPrompt(message) {
  return `You are an expert Indian financial advisor AI assistant. Provide practical, actionable financial advice.

User Context:
- Location: India (INR currency)  
- Monthly Income: ₹80,000
- Monthly Expenses: ₹20,000
- Total Savings: ₹3,50,000
- Investments: ₹5,00,000
- Outstanding Loan: ₹10,00,000 (EMI: ₹25,000)

User Question: "${message}"

Instructions:
1. Give specific, actionable advice for Indian financial context
2. Mention relevant Indian financial products (SIP, PPF, ELSS, FD, NPS, etc.)
3. Include tax implications when relevant (80C, 80D, etc.)
4. Use simple language and provide practical steps
5. Keep response concise (3-4 sentences max)
6. Always add a disclaimer about consulting a financial advisor for personalized advice

Provide your financial advice:`;
}

// ✅ Fixed Function to call Gemini API
async function callGeminiAPI(message) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: createGeminiPrompt(message),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts[0]
    ) {
      return response.data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Invalid response structure from Gemini API");
    }
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw error;
  }
}

// Main chat route
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      reply:
        "Please ask me a finance-related question! I can help with budgeting, investments, savings, loans, taxes, and more.",
    });
  }

  const msg = message.toLowerCase().replace(/[.,!?]/g, "").trim();

  // First, check for predefined responses
  const matches = [];
  for (const key in responses) {
    if (msg.includes(key)) {
      matches.push(responses[key]);
    }
  }

  if (matches.length > 0) {
    return res.json({ reply: matches.join("\n") });
  }

  // Try Gemini AI response
  try {
    const aiReply = await callGeminiAPI(message);
    return res.json({ reply: aiReply });
  } catch (error) {
    console.error("Gemini API failed:", error.message);
    return res.json({
      reply:
        "I'm having trouble connecting to my AI assistant right now, but I can still help with basic finance queries like budgeting, investments, savings, loans, and taxes.",
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "active",
    message: "Finance chatbot with Gemini AI is running",
    apiStatus: "connected",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

