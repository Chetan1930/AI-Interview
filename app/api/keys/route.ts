import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ApiKey } from '@/lib/models/ApiKey';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { VALID_PROVIDERS } from '@/lib/provider-types';
import type { AIProvider } from '@/lib/provider-types';

async function getUserId(): Promise<string | null> {
  const token = getTokenFromCookies();
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// GET /api/keys — List user's API keys (masked)
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const keys = await ApiKey.find({ userId })
      .select('-encryptedKey')
      .sort({ createdAt: -1 })
      .lean();

    const maskedKeys = keys.map((k: any) => ({
      _id: k._id,
      provider: k.provider,
      label: k.label,
      isDefault: k.isDefault,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      keyHint: '[Saved key]',
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error: any) {
    console.error('Get keys error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch keys' }, { status: 500 });
  }
}

// POST /api/keys — Add a new API key
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, apiKey, label, makeDefault } = await req.json();

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate the key by making a test call
    try {
      await validateKey(provider as AIProvider, apiKey.trim());
    } catch (e: any) {
      return NextResponse.json(
        { error: `Invalid API key: ${e.message}` },
        { status: 400 }
      );
    }

    const encrypted = encrypt(apiKey.trim());

    await connectDB();

    // If makeDefault is true, unset other defaults for this provider
    if (makeDefault) {
      await ApiKey.updateMany(
        { userId, provider: provider as AIProvider, isDefault: true },
        { isDefault: false }
      );
    }

    const key = await ApiKey.create({
      userId,
      provider: provider as AIProvider,
      encryptedKey: encrypted,
      label: label || `My ${provider.charAt(0).toUpperCase() + provider.slice(1)} Key`,
      isDefault: makeDefault || false,
    });

    return NextResponse.json(
      {
        key: {
          _id: key._id,
          provider: key.provider,
          label: key.label,
          isDefault: key.isDefault,
          createdAt: key.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create key error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save key' }, { status: 500 });
  }
}

// DELETE /api/keys — Delete a key by id or provider
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');
    const provider = searchParams.get('provider');

    await connectDB();

    if (keyId) {
      await ApiKey.findOneAndDelete({ _id: keyId, userId } as any);
    } else if (provider && VALID_PROVIDERS.includes(provider as AIProvider)) {
      await ApiKey.deleteMany({ userId, provider: provider as AIProvider } as any);
    } else {
      return NextResponse.json({ error: 'Provide id or valid provider to delete' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete key error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete key' }, { status: 500 });
  }
}

// PUT /api/keys — Update a key (set default, update label)
export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { _id, makeDefault, label } = await req.json();

    await connectDB();

    if (makeDefault) {
      const targetKey = await ApiKey.findOne({ _id, userId } as any);
      if (!targetKey) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
      }
      await ApiKey.updateMany(
        { userId, provider: targetKey.provider, isDefault: true } as any,
        { isDefault: false }
      );
      await ApiKey.updateOne({ _id, userId } as any, { isDefault: true });
    }

    if (label !== undefined) {
      await ApiKey.updateOne({ _id, userId } as any, { label });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update key error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update key' }, { status: 500 });
  }
}

// ─── Key Validation ───────────────────────────────────────────────

async function validateKey(provider: AIProvider, key: string): Promise<void> {
  switch (provider) {
    case 'gemini': {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('Say "ok" if you can hear me.');
      await result.response.text();
      break;
    }
    case 'openai': {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: key });
      await openai.models.list();
      break;
    }
    case 'claude': {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: key });
      await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say OK' }],
      });
      break;
    }
  }
}
