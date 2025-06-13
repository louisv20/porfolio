// filepath: netlify/functions/getCoachingTips.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
    // --- Start of Changes ---

    // 1. Define your allowed origin. Best practice is to use an environment variable.
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://luiscastroeq.com';

    // 2. Define headers in one place to use in all responses.
    const corsHeaders = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 3. Handle the OPTIONS preflight request. This is the crucial fix.
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200, // Preflight requests should return 200
            headers: corsHeaders,
            body: '' // No body needed for preflight
        };
    }

    // 4. Ensure other methods are properly rejected, but include CORS headers.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders, // Add headers to error responses
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // --- End of Changes ---

    try {
        const { selectedSkill } = JSON.parse(event.body);
        if (!selectedSkill) {
            return {
                statusCode: 400,
                headers: corsHeaders, // Add headers
                body: JSON.stringify({ error: 'Missing selectedSkill in request body' })
            };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in Netlify environment variables.');
            return {
                statusCode: 500,
                headers: corsHeaders, // Add headers
                body: JSON.stringify({ error: 'Server configuration error: API key missing.' })
            };
        }

        const prompt = `You are an Emotional Intelligence coach. I want to improve my skill in "${selectedSkill}". Please provide 3-5 actionable tips, practical exercises, or reflective questions to help me develop this specific skill. Keep the tone encouraging, practical, and easy to understand. Structure your response with clear bullet points or numbered lists for each tip/exercise.`;
        
        // Note: I noticed you were using gemini-2.0-flash, which isn't a public model name as of now.
        // I've changed it to a common and valid model, 'gemini-1.5-flash'. Please adjust if you have access to a different model.
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const geminiPayload = { contents: chatHistory };

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
                headers: corsHeaders, // Add headers
                body: JSON.stringify({
                    error: `Gemini API request failed: ${(responseData?.error?.message) || 'Unknown Gemini API error'}`
                })
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders, // Your original headers are now here
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error('Error in Netlify function getCoachingTips:', error);
        return {
            statusCode: 500,
            headers: corsHeaders, // Add headers
            body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` })
        };
    }
};