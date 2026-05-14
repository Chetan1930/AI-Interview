import { NextRequest, NextResponse } from 'next/server';
import { evaluateMockAnswer, getNextMockQuestion } from '@/lib/gemini';
import type { MockInterviewMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { sessionContext, messages, action, question, answer } = await req.json();

    if (action === 'next') {
      const nextQuestion = await getNextMockQuestion(sessionContext, messages || []);
      return NextResponse.json({ question: nextQuestion });
    }

    if (action === 'evaluate') {
      const [evaluation, nextQuestion] = await Promise.all([
        evaluateMockAnswer(question, answer, sessionContext),
        getNextMockQuestion(sessionContext, messages || []),
      ]);
      return NextResponse.json({ evaluation, nextQuestion });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mock interview error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process mock interview' }, { status: 500 });
  }
}
