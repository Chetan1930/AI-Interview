import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeVsJD } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();
    if (!resumeText?.trim()) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    const result = await analyzeResumeVsJD(resumeText, jobDescription);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume' }, { status: 500 });
  }
}
