import { NextRequest, NextResponse } from 'next/server';
import { evaluateMockAnswer, getNextMockQuestion, getProviderConfig } from '@/lib/ai';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';
import type { MockInterviewMessage } from '@/lib/types';

function getUserId(): string | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionContext, messages, action, question, answer } = await req.json();
    const userId = getUserId();
    const config = await getProviderConfig(userId || undefined);

    if (action === 'next') {
      const nextQuestion = await getNextMockQuestion(sessionContext, messages || [], config);
      return NextResponse.json({ question: nextQuestion });
    }

    if (action === 'evaluate') {
      const [evaluation, nextQuestion] = await Promise.all([
        evaluateMockAnswer(question, answer, sessionContext, config),
        getNextMockQuestion(sessionContext, messages || [], config),
      ]);
      return NextResponse.json({ evaluation, nextQuestion });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mock interview error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process mock interview' }, { status: 500 });
  }
}
