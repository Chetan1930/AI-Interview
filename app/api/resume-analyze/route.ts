import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeVsJD, getProviderConfig } from '@/lib/ai';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

function getUserId(): string | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();
    if (!resumeText?.trim()) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    const userId = getUserId();
    const config = await getProviderConfig(userId || undefined);
    const result = await analyzeResumeVsJD(resumeText, jobDescription, config);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume' }, { status: 500 });
  }
}
