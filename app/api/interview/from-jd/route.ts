import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewFromJD, getProviderConfig } from '@/lib/ai';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    const userId = getAuthenticatedUserId();
    const config = await getProviderConfig(userId || undefined);
    const content = await generateInterviewFromJD(jobDescription, config);
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Interview from JD error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate interview content' }, { status: 500 });
  }
}
