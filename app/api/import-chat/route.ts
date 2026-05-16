import { NextRequest, NextResponse } from 'next/server';

// ── Clean Jina Reader output ──────────────────────────────────────

// ── Strip HTML tags (for when Jina returns HTML in the text) ────────
function stripHtml(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '');
}

// ── Remove Jina Reader metadata prefix ────────────────────────────
function stripJinaMetadata(text: string): string {
  return text
    .replace(/^Title:.*$/im, '')
    .replace(/^URL Source:.*$/im, '')
    .replace(/^Markdown Content:.*$/im, '')
    .replace(/^Description:.*$/im, '')
    .replace(/^Icon URL:.*$/im, '')
    .replace(/^Date:.*$/im, '')
    .replace(/^\!\[.*?\]\(.*?\)\s*$/gm, '')
    .trim();
}

const NOISE_PATTERNS = [
  /^New chat\s*$/im,
  /^Search chats\s*$/im,
  /^Images\s*$/im,
  /^Apps\s*$/im,
  /^Deep research\s*$/im,
  /^See plans and pricing\s*$/im,
  /^Settings\s*$/im,
  /^Help\s*$/im,
  /^Log in\s*$/im,
  /^Sign up for free\s*$/im,
  /^Get responses tailored to you\s*$/im,
  /^Log in to get answers.*$/im,
  /^This is a copy of a shared.*$/im,
  /^Report conversation\s*$/im,
  /^Show more Show less\s*$/im,
  /^ChatGPT\s+(is|can|may|might)\s+.*$/im,
  /^Check important info\.?\s*$/im,
  /^\(?I don't need perfect.*\)?\s*$/im,
  /^Voice\s*$/im,
  /^Chat history\s*$/im,
  /^\[x\]\s*$/im,
  /^Skip to content\s*$/im,
  /^Welcome back\s*$/im,
  /^What can I help with\?\s*$/im,
  /^New chat ⇧⌘O\s*$/im,
  /^\[.*?\]\(.*?\)\s*$/im,  // empty markdown links like [](url)
  /^!\[.*?\]\(.*?\)\s*$/im, // image references like ![Audio 2](url)
  /^_{1,2}\s*$/m,               // stray _ or __ on its own line
  /^>\s*$\s*/m,                  // stray > on its own line
];

function cleanJinaOutput(text: string): string {
  // Step 0: Strip HTML tags and Jina metadata
  let clean = stripHtml(text);
  clean = stripJinaMetadata(clean);

  // Step 1: Find all #### Speaker said: blocks (this is the conversation structure)
  const parts = clean.split(/\n(?=#### )/);
  const messageBlocks: { speaker: string; content: string }[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Match: #### Speaker said:\ncontent
    const headerEnd = trimmed.indexOf('\n');
    if (headerEnd === -1) continue;

    const header = trimmed.slice(0, headerEnd).trim();
    let content = trimmed.slice(headerEnd + 1).trim();

    const speakerMatch = header.match(/^#### (.+?) said:$/);
    if (!speakerMatch) continue;

    const speaker = speakerMatch[1].trim();

    // Clean the content: remove noise lines
    for (const pattern of NOISE_PATTERNS) {
      content = content.replace(pattern, '');
    }

    // Remove multiple consecutive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    content = content.trim();
    if (!content) continue;

    messageBlocks.push({ speaker, content });
  }

  if (messageBlocks.length === 0) {
    // Fallback: basic cleanup for unstructured text
    let fallback = clean;
    for (const pattern of NOISE_PATTERNS) {
      fallback = fallback.replace(pattern, '');
    }
    fallback = fallback.replace(/\n{3,}/g, '\n\n').trim();
    return fallback;
  }

  // Step 2: Convert to clean **Speaker:** format
  const output: string[] = [];
  for (const block of messageBlocks) {
    const role = block.speaker === 'You' ? 'User' : 'Assistant';
    output.push(`**${role}:**`);
    output.push(block.content);
    output.push('');
  }

  return output.join('\n').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url?.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please enter a valid URL.' },
        { status: 400 }
      );
    }

    // Only allow supported domains
    const allowedHosts = [
      'chatgpt.com',
      'chat.openai.com',
      'claude.ai',
      'claude.site',
      'gemini.google.com',
      'aistudio.google.com',
      'deepseek.com',
      'chat.deepseek.com',
      'chat.mistral.ai',
      'copilot.microsoft.com',
    ];

    if (!allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
      return NextResponse.json(
        {
          error: 'Unsupported URL. Please use a link from: ChatGPT, Claude, Gemini, DeepSeek, Mistral, or Copilot.',
          allowedHosts,
        },
        { status: 400 }
      );
    }

    // Fetch rendered content via Jina Reader (free, no API key needed)
    // The URL goes in the path as-is (not encoded) for Jina to parse correctly
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; ChatImport/1.0)',
      },
    });

    if (!response.ok) {
      // If Jina Reader fails, try a direct fetch as fallback
      const directResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
      });

      if (!directResponse.ok) {
        return NextResponse.json(
          { error: 'Could not access the page. The link may be private or the service may be temporarily unavailable.' },
          { status: 502 }
        );
      }

      const html = await directResponse.text();

      // Try to extract content from HTML (best effort)
      const cleaned = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50000);

      if (cleaned.length < 50) {
        return NextResponse.json(
          { error: 'Could not read the conversation from this link. The page requires JavaScript to render.' },
          { status: 422 }
        );
      }

      return NextResponse.json({ content: cleanJinaOutput(cleaned) });
    }

    const text = await response.text();
    const cleaned = cleanJinaOutput(text);

    if (!cleaned || cleaned.length < 20) {
      return NextResponse.json(
        { error: 'No conversation content found at this link.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ content: cleaned });
  } catch (error: any) {
    console.error('Import chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import chat. Please try pasting the conversation manually.' },
      { status: 500 }
    );
  }
}
