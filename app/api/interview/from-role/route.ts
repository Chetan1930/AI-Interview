import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewFromRole } from '@/lib/gemini';
import type { RoleInput } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const input: RoleInput = await req.json();
    if (!input.role?.trim()) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }
    const content = await generateInterviewFromRole(input);
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Interview from role error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate interview content' }, { status: 500 });
  }
}
