// File path: /api/generateQuiz.js
// This Vercel Serverless Function securely handles API calls with a fallback mechanism.

// Read up to 20 API keys from Vercel Environment Variables.
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
  process.env.GEMINI_API_KEY6,
  process.env.GEMINI_API_KEY7,
  process.env.GEMINI_API_KEY8,
  process.env.GEMINI_API_KEY9,
  process.env.GEMINI_API_KEY10,
  process.env.GEMINI_API_KEY11,
  process.env.GEMINI_API_KEY12,
  process.env.GEMINI_API_KEY13,
  process.env.GEMINI_API_KEY14,
  process.env.GEMINI_API_KEY15,
  process.env.GEMINI_API_KEY16,
  process.env.GEMINI_API_KEY17,
  process.env.GEMINI_API_KEY18,
  process.env.GEMINI_API_KEY19,
  process.env.GEMINI_API_KEY20,
].filter(Boolean); // Removes any keys that are not set.

/**
 * **NEW FEATURE: Tries to call the Gemini API with fallback keys.**
 * It will iterate through the available API keys until a request is successful.
 * @param {string} prompt - The prompt to send to the Gemini API.
 * @returns {Promise<object>} - The parsed JSON response from the Gemini API.
 * @throws {Error} - Throws an error if all available API keys fail.
 */
async function callGeminiWithFallback(prompt) {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error("Server is not configured with any API keys.");
  }

  // Loop through each key until one works
  for (const apiKey of GEMINI_API_KEYS) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // If the response is successful (status 200-299), process and return it.
      if (response.ok) {
        console.log(`Successfully used an API key.`);
        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
          throw new Error('Unexpected response format from Gemini API.');
        }

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON object found in the Gemini response.');
        }
        
        return JSON.parse(jsonMatch[0]); // Success! Return the data.
      }

      // If the key is invalid or has a quota issue, log it and try the next key.
      console.warn(`API key failed with status ${response.status}. Trying next key...`);

    } catch (error) {
      // Handle network errors or other fetch-related issues
      console.warn(`Fetch failed for an API key: ${error.message}. Trying next key...`);
    }
  }

  // If the loop finishes without a successful call, all keys have failed.
  throw new Error("All available API keys failed. Please check your keys and quotas.");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Call the new function that handles the fallback logic
    const quizObject = await callGeminiWithFallback(prompt);
    res.status(200).json(quizObject);

  } catch (error) {
    console.error('Final error after trying all keys:', error);
    res.status(500).json({ message: error.message });
  }
}
