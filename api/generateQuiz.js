// File path: /api/generateQuiz.js
// This Vercel Serverless Function securely handles API calls with a fallback mechanism
// and is protected by a secret key to only allow access from the designated Android app.

// Read up to 20 API keys from Vercel Environment Variables.
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3, process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5, process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7, process.env.GEMINI_API_KEY_8,
  process.env.GEMINI_API_KEY_9, process.env.GEMINI_API_KEY_10,
  process.env.GEMINI_API_KEY_11, process.env.GEMINI_API_key_12,
  process.env.GEMINI_API_KEY_13, process.env.GEMINI_API_KEY_14,
  process.env.GEMINI_API_KEY_15, process.env.GEMINI_API_KEY_16,
  process.env.GEMINI_API_KEY_17, process.env.GEMINI_API_KEY_18,
  process.env.GEMINI_API_KEY_19, process.env.GEMINI_API_KEY_20,
].filter(Boolean); // Removes any keys that are not set.

/**
 * Tries to call the Gemini API with fallback keys.
 * @param {string} prompt - The prompt to send to the Gemini API.
 * @returns {Promise<object>} - The parsed JSON response from the Gemini API.
 * @throws {Error} - Throws an error if all available API keys fail.
 */
async function callGeminiWithFallback(prompt) {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error("Server is not configured with any API keys.");
  }

  for (const apiKey of GEMINI_API_KEYS) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
        
        return JSON.parse(jsonMatch[0]);
      }

      console.warn(`API key failed with status ${response.status}. Trying next key...`);

    } catch (error) {
      console.warn(`Fetch failed for an API key: ${error.message}. Trying next key...`);
    }
  }

  throw new Error("All available API keys failed. Please check your keys and quotas.");
}


// --- Main Vercel Handler Function ---
export default async function handler(req, res) {
  
  // --- START: Security Check using Secret Key ---
  // This is the most important part for protecting your API
  const expectedSecretKey = process.env.ANDROID_APP_SECRET_KEY;
  const receivedSecretKey = req.headers['x-app-secret-key'];

  // If the secret key on the server is not set, or the key from the app does not match, block access.
  if (!expectedSecretKey || receivedSecretKey !== expectedSecretKey) {
    return res.status(403).json({ message: 'Forbidden: Unauthorized Access.' });
  }
  // --- END: Security Check ---

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Call the function that handles the Gemini API call and key fallback
    const quizObject = await callGeminiWithFallback(prompt);
    res.status(200).json(quizObject);

  } catch (error) {
    console.error('Final error after trying all keys:', error);
    res.status(500).json({ message: error.message });
  }
}
