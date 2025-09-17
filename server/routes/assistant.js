import express from "express";
const router = express.Router();

// Example simple AI-like response
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message is required" });
    }

    // Here you can integrate OpenAI, Gemini, or your finance logic.
    // For now, respond with a simple mock:
    let reply = "";

    if (message.toLowerCase().includes("expense")) {
      reply = "You spent ₹12,000 on expenses this month.";
    } else if (message.toLowerCase().includes("income")) {
      reply = "Your income this month is ₹50,000.";
    } else if (message.toLowerCase().includes("budget")) {
      reply = "Your budget is set at ₹40,000 for this month.";
    } else if (message.toLowerCase().includes("report")) {
      reply = "You can download your financial report from the Reports section.";
    } else {
      reply = `I heard: "${message}". Right now I only understand income, expense, budget, and report.`;
    }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error, please try again later." });
  }
});

export default router;
