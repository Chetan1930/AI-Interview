import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewFromJD } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    const content = await generateInterviewFromJD(jobDescription);
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Interview from JD error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate interview content' }, { status: 500 });
  }
}
