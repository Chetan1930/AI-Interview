import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Session } from '@/lib/models/Session';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    await connectDB();

    const filter: Record<string, any> = { userId };
    if (type) {
      filter.sessionType = type;
    }

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, sessionType, inputData, generatedContent } = body;

    if (!title?.trim() || !sessionType || !inputData) {
      return NextResponse.json(
        { error: 'Title, sessionType, and inputData are required' },
        { status: 400 }
      );
    }

    const validTypes = ['jd', 'role', 'resume-analysis', 'chat-import', 'voice-interview'];
    if (!validTypes.includes(sessionType)) {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await Session.create({
      userId,
      title: title.trim(),
      sessionType,
      inputData,
      generatedContent: generatedContent || null,
    });

    return NextResponse.json(
      {
        session: {
          id: session._id.toString(),
          title: session.title,
          sessionType: session.sessionType,
          inputData: session.inputData,
          generatedContent: session.generatedContent,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}
