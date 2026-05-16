'use client';

import { useState, useCallback, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check, Terminal } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  message: ChatMessageData;
  index: number;
}

// ─── Code Block Parser ─────────────────────────────────────────────

interface ContentSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseContent(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: 'text', content: before });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) segments.push({ type: 'text', content: remaining });
  }

  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'text', content: text.trim() });
  }

  return segments;
}

// ─── Inline Markdown Renderer ──────────────────────────────────────

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'strikethrough' | 'link';
  text: string;
  href?: string;
}

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(~~(.+?)~~)|(\[(.+?)\]\((.+?)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'text', text: text.slice(last, m.index) });
    }
    if (m[1]) tokens.push({ type: 'bold', text: m[2] });
    else if (m[3]) tokens.push({ type: 'italic', text: m[4] });
    else if (m[5]) tokens.push({ type: 'code', text: m[6] });
    else if (m[7]) tokens.push({ type: 'strikethrough', text: m[8] });
    else if (m[9]) tokens.push({ type: 'link', text: m[10], href: m[11] });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    tokens.push({ type: 'text', text: text.slice(last) });
  }

  return tokens;
}

function renderTokens(tokens: InlineToken[], keyPrefix: string): React.ReactNode[] {
  return tokens.map((t, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (t.type) {
      case 'bold':
        return <strong key={key} className="font-semibold">{t.text}</strong>;
      case 'italic':
        return <em key={key} className="italic">{t.text}</em>;
      case 'code':
        return (
          <code key={key} className="inline-code">
            {t.text}
          </code>
        );
      case 'strikethrough':
        return <del key={key} className="line-through opacity-70">{t.text}</del>;
      case 'link':
        return (
          <a key={key} href={t.href} target="_blank" rel="noopener noreferrer" className="inline-link">
            {t.text}
          </a>
        );
      default:
        return <Fragment key={key}>{t.text}</Fragment>;
    }
  });
}

// ─── Block-Level Renderer ──────────────────────────────────────────

type BlockType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list-item'; ordered: boolean; text: string }
  | { type: 'hr' }
  | { type: 'empty' };

function parseLine(line: string): BlockType {
  const trimmed = line.trim();

  if (!trimmed) return { type: 'empty' };

  // Heading ##, ###, ####
  const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
  if (headingMatch) {
    return { type: 'heading', level: headingMatch[1].length, text: headingMatch[2] };
  }

  // Horizontal rule
  if (/^[-*=]{3,}$/.test(trimmed)) {
    return { type: 'hr' };
  }

  // Blockquote >
  if (trimmed.startsWith('> ')) {
    return { type: 'blockquote', text: trimmed.slice(2) };
  }

  // Unordered list - or *
  const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
  if (ulMatch) {
    return { type: 'list-item', ordered: false, text: ulMatch[1] };
  }

  // Ordered list 1.
  const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
  if (olMatch) {
    return { type: 'list-item', ordered: true, text: olMatch[1] };
  }

  return { type: 'paragraph', text: trimmed };
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: { type: BlockType; key: number }[] = lines.map((line, i) => ({
    type: parseLine(line),
    key: i,
  }));

  // Group consecutive list items together
  const grouped: { items: { type: BlockType; key: number }[]; ordered: boolean; key: number }[] = [];
  let currentList: typeof blocks | null = null;

  for (const block of blocks) {
    if (block.type.type === 'list-item') {
      if (!currentList) {
        currentList = [];
        currentList.push(block);
      } else {
        currentList.push(block);
      }
    } else {
      if (currentList) {
        grouped.push({
          items: currentList,
          ordered: currentList[0].type.type === 'list-item' && currentList[0].type.ordered,
          key: currentList[0].key,
        });
        currentList = null;
      }
      grouped.push({ items: [block], ordered: false, key: block.key });
    }
  }

  if (currentList) {
    grouped.push({
      items: currentList,
      ordered: currentList[0].type.type === 'list-item' && currentList[0].type.ordered,
      key: currentList[0].key,
    });
  }

  return (
    <div className="space-y-2">
      {grouped.map((group) => {
        if (group.items.length > 1 && group.items[0].type.type === 'list-item') {
          const ListTag = group.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={group.key} className={`space-y-1 ${group.ordered ? 'list-decimal' : 'list-disc'} pl-5 text-sm`}>
              {group.items.map((item, idx) => {
                const listBlock = item.type as Extract<BlockType, { type: 'list-item' }>;
                return (
                  <li key={idx} className="pl-1">
                    {renderTokens(tokenizeInline(listBlock.text), `${group.key}-li-${idx}`)}
                  </li>
                );
              })}
            </ListTag>
          );
        }

        const block = group.items[0];
        switch (block.type.type) {
          case 'heading': {
            const h = block.type;
            const size = h.level === 1 ? 'text-lg font-bold' : h.level === 2 ? 'text-base font-semibold' : h.level === 3 ? 'text-sm font-semibold' : 'text-xs font-semibold uppercase tracking-wider text-muted-foreground/70';
            return (
              <div key={block.key} className={size}>
                {renderTokens(tokenizeInline(h.text), `${block.key}-h`)}
              </div>
            );
          }
          case 'blockquote':
            return (
              <blockquote key={block.key} className="blockquote">
                {renderTokens(tokenizeInline(block.type.text), `${block.key}-bq`)}
              </blockquote>
            );
          case 'hr':
            return <hr key={block.key} className="my-2 border-border/40" />;
          case 'empty':
            return <div key={block.key} className="h-2" />;
          default: {
            const tokens = tokenizeInline(block.type.text);
            return (
              <p key={block.key} className="text-sm leading-relaxed">
                {renderTokens(tokens, `${block.key}-p`)}
              </p>
            );
          }
        }
      })}
    </div>
  );
}

// ─── Syntax Highlighted Code Block ─────────────────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const lines = code.split('\n').length;

  return (
    <div className="code-block group">
      <div className="code-block-header">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 opacity-60" />
          <span className="text-[11px] font-mono uppercase tracking-wider opacity-70">
            {language}
          </span>
          <span className="text-[10px] opacity-40 ml-1">{lines} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="code-block-copy-btn"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-green-400">
              <Check className="h-3 w-3" /> Copied
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy className="h-3 w-3" /> Copy
            </span>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '14px 18px',
          fontSize: '12.5px',
          lineHeight: '1.65',
          borderRadius: 0,
          background: '#1a1a2e',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        }}
        showLineNumbers={lines > 3}
        wrapLines
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Message Content Renderer ──────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const segments = parseContent(content);

  if (segments.length === 1 && segments[0].type === 'text') {
    return <FormattedText text={content} />;
  }

  return (
    <div className="space-y-3">
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <CodeBlock key={i} language={seg.language || 'text'} code={seg.content} />
        ) : (
          <FormattedText key={i} text={seg.content} />
        )
      )}
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────

export function ChatMessage({ message, index }: Props) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.6), duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ring-2 ring-background ${
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20'
            : 'bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 text-muted-foreground shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[95%] sm:max-w-[90%] lg:max-w-full group ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-2xl rounded-tr-md'
              : 'bg-card text-foreground shadow-sm border border-border/50 rounded-2xl rounded-tl-md'
          }`}
        >
          <MessageContent content={message.content} />

          {/* Copy button */}
          <button
            onClick={copyContent}
            className={`absolute -bottom-8 ${
              isUser ? 'right-0' : 'left-0'
            } opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Role label */}
        <p className={`text-[10px] text-muted-foreground/60 mt-1.5 px-1 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'You' : 'Assistant'}
        </p>
      </div>
    </motion.div>
  );
}
