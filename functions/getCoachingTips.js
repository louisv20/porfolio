// filepath: netlify/functions/getCoachingTips.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { selectedSkill } = JSON.parse(event.body);
        if (!selectedSkill) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing selectedSkill in request body' }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in Netlify environment variables.');
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: API key missing.' }) };
        }

        const prompt = `You are an Emotional Intelligence coach. I want to improve my skill in "${selectedSkill}". Please provide 3-5 actionable tips, practical exercises, or reflective questions to help me develop this specific skill. Keep the tone encouraging, practical, and easy to understand. Structure your response with clear bullet points or numbered lists for each tip/exercise.`;
        
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const geminiPayload = { contents: chatHistory };
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        const responseData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', responseData);
            return { 
                statusCode: geminiResponse.status, 
                body: JSON.stringify({ 
                    error: `Gemini API request failed: ${(responseData && responseData.error && responseData.error.message) || 'Unknown Gemini API error'}` 
                }) 
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseData) // Forward Gemini's response
        };

    } catch (error) {
        console.error('Error in Netlify function getCoachingTips:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }) 
        };
    }
};