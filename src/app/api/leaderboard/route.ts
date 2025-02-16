import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('serverId');

  if (!serverId) {
    return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
  }

  const API_BASE_URL = `https://mee6.xyz/api/plugins/levels/leaderboard/${serverId}`;

  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching leaderboard data' }, { status: 500 });
  }
}