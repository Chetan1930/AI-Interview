import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewFromJD, getProviderConfig } from '@/lib/ai';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

function getUserId(): string | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    const userId = getUserId();
    const config = await getProviderConfig(userId || undefined);
    const content = await generateInterviewFromJD(jobDescription, config);
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Interview from JD error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate interview content' }, { status: 500 });
  }
}
