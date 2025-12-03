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
    const { message, nutritionData, workoutData, workoutLogs } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are a personal health and fitness AI assistant. You have access to the user's health data and should provide personalized advice, motivation, and insights.

USER'S DATA:
${nutritionData ? `
NUTRITION (Last 7 Days):
${nutritionData}
` : 'No recent nutrition data available.'}

${workoutData ? `
WORKOUT SCHEDULE:
${workoutData}
` : 'No workout schedule set yet.'}

${workoutLogs ? `
RECENT WORKOUT COMPLETION:
${workoutLogs}
` : 'No recent workout logs.'}

GOALS:
- Daily Calories: 2500 kcal
- Protein: 150g
- Carbs: 300g
- Fats: 80g

Your responsibilities:
1. Provide personalized health and fitness advice based on their data
2. Help them reach their nutrition and fitness goals
3. Analyze their patterns and suggest improvements
4. Motivate and encourage them
5. Answer questions about their progress, nutrition, and workouts
6. Be supportive, knowledgeable, and friendly

When analyzing their data:
- Look for trends in nutrition (are they hitting their macros?)
- Check workout consistency (are they completing their scheduled workouts?)
- Identify areas for improvement
- Celebrate their wins

Keep responses conversational, encouraging, and actionable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
}
