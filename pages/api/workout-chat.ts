import type { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '@/utils/openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, currentDay } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are a fitness coach helping users create effective workout routines.
${currentDay ? `The user is currently viewing their ${currentDay} workout schedule.` : ''}

When recommending exercises:
1. First provide a brief explanation of your reasoning (2-3 sentences max)
2. Suggest specific exercises that are effective and safe
3. Include appropriate sets, reps, and optional weight recommendations
4. Consider muscle groups, workout balance, and progression
5. Be practical and accommodating to different fitness levels

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format, with no additional text:
{
  "explanation": "For a balanced upper body day, I'm recommending compound movements followed by isolation exercises. This combination will build strength while ensuring proper muscle development.",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 4,
      "reps": "8-10",
      "weight": "Moderate weight"
    },
    {
      "name": "Pull-ups",
      "sets": 3,
      "reps": "10-12",
      "weight": "Bodyweight"
    },
    {
      "name": "Shoulder Press",
      "sets": 3,
      "reps": "10-12",
      "weight": "Light to moderate"
    }
  ]
}

Do not include any text outside the JSON object. Only valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || '{}';

    // Try to parse as JSON, if it fails, return as text
    try {
      const response = JSON.parse(reply);
      if (response.exercises && response.explanation) {
        res.status(200).json({ 
          exercises: response.exercises, 
          explanation: response.explanation,
          isStructured: true 
        });
      } else {
        // Fallback to text response if not valid structure
        res.status(200).json({ reply, isStructured: false });
      }
    } catch {
      // Fallback to text response if not valid JSON
      res.status(200).json({ reply, isStructured: false });
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
}
