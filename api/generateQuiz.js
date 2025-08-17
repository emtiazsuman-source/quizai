// api/generateQuiz.js

export default async function handler(request, response) {
  // Shudhu POST request anumoto
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    // Frontend theke pathano data (prompt) neya hocche
    const { prompt } = request.body;

    // Vercel Environment Variable theke API key neya hocche
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found.");
    }

    const modelName = "gemini-2.5-flash-preview-05-20";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    // Gemini API-ke call kora hocche
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error("Gemini API Error:", errorData);
        return response.status(geminiResponse.status).json({ message: 'Error from Gemini API', details: errorData });
    }

    const result = await geminiResponse.json();

    // Frontend-e response ferot pathano hocche
    return response.status(200).json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
