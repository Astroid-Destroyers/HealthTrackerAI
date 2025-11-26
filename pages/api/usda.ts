import type { NextApiRequest, NextApiResponse } from 'next';

const USDA_API_KEY = 'JTKYw0U3b0nFJJU42NIfY2Zwgw4iR0WeyuJkro66';
const API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    // Fetching both Foundation (generic) and Branded (packaged) foods
    const response = await fetch(
      `${API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,Branded`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data from USDA API');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('USDA API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
