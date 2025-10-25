# AdSim: The AI-Powered Ad Simulator & Focus Group

**AdSim** is a revolutionary platform that allows marketing professionals to test and analyze their creative advertisements against a simulated audience of diverse AI personas.

Upload your ad, and our multi-modal AI will analyze its content, tone, and key features. Then, watch in a real-time chat environment as a variety of AI agents, each with a unique personality and background, react to and discuss your ad. It's an instant, AI-powered focus group at your fingertips.

This project merges the analytical power of ad intelligence with the dynamic, unpredictable nature of a social simulator, providing deep, actionable insights for creative teams.

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express
- **Real-time Communication:** LiveKit (for chat and potential voice features)
- **AI & Machine Learning:**
  - **Ad Analysis:** Reka API (for multi-modal analysis)
  - **AI Personas:** Claude, Janitor AI, Fetch.ai
  - **Voice Generation:** Fish Audio
- **Deployment:** Vercel, Docker

---

## Key Features

1.  **Ad Uploader:** A simple interface to upload video or image-based advertisements.
2.  **AI-Powered Analysis:** The platform automatically analyzes the ad for:
    - Sentiment and Tone
    - Object and Brand Recognition
    - Demographic Targeting Predictions
    - A summary of the creative's message and style.
3.  **Real-Time Audience Simulation:**
    - The ad and its analysis are presented in a chat room.
    - A diverse cast of AI personas (e.g., "Skeptical Steve," "Enthusiastic Emily," "Data-Driven Dana") react to the ad in real-time.
    - Each persona is an autonomous Fetch.ai agent powered by a unique instance of an LLM like Claude.
4.  **Interactive Dashboard:**
    - View the analysis results on a clean, visual dashboard.
    - Observe the live chat simulation.
    - (Future) Interact with the AI agents to ask follow-up questions.
5.  **Voice Integration (Stretch Goal):** Use LiveKit and Fish Audio to allow users to talk to the AI agents and hear their responses.

---
