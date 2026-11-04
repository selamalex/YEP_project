import React, { useState, useCallback } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline Tokenizer & Formatter
// ---------------------------------------------------------------------------

type InlineTokenType =
  | "code"
  | "link"
  | "bold_italic"
  | "bold"
  | "italic"
  | "strike"
  | "url"
  | "mention";

interface InlineMatch {
  type: InlineTokenType;
  index: number;
  length: number;
  text: string;
  extra?: string | undefined;
}

/**
 * Parses inline markdown:
 * - `code`
 * - [label](url)
 * - ***bold italic*** or ___bold italic___
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - https:// URLs
 * - @handles (Telegram / social)
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  const results: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    const matches: InlineMatch[] = [];

    // 1. Inline code: `code`
    const codeMatch = remaining.match(/`([^`\n]+)`/);
    if (codeMatch && codeMatch.index !== undefined && codeMatch[1]) {
      matches.push({
        type: "code",
        index: codeMatch.index,
        length: codeMatch[0].length,
        text: codeMatch[1],
      });
    }

    // 2. Markdown Link: [label](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)\s]+)\)/);
    if (linkMatch && linkMatch.index !== undefined && linkMatch[1] && linkMatch[2]) {
      matches.push({
        type: "link",
        index: linkMatch.index,
        length: linkMatch[0].length,
        text: linkMatch[1],
        extra: linkMatch[2],
      });
    }

    // 3. Bold Italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/(?:\*\*\*|___)([\s\S]+?)(?:\*\*\*|___)/);
    if (boldItalicMatch && boldItalicMatch.index !== undefined && boldItalicMatch[1]) {
      matches.push({
        type: "bold_italic",
        index: boldItalicMatch.index,
        length: boldItalicMatch[0].length,
        text: boldItalicMatch[1],
      });
    }

    // 4. Bold: **text** or __text__
    const boldMatch = remaining.match(/(?:\*\*|__)([\s\S]+?)(?:\*\*|__)/);
    if (boldMatch && boldMatch.index !== undefined && boldMatch[1]) {
      matches.push({
        type: "bold",
        index: boldMatch.index,
        length: boldMatch[0].length,
        text: boldMatch[1],
      });
    }

    // 5. Italic: *text* or _text_
    const italicMatch = remaining.match(/(?:(?<=\s|^)\*|\b\*)([^*\n]+?)\*(?=\s|$|[.,!?;:])|(?:(?<=\s|^)_|\b_)([^_\n]+?)_(?=\s|$|[.,!?;:])/);
    if (italicMatch && italicMatch.index !== undefined) {
      const matchedText = italicMatch[1] || italicMatch[2];
      if (matchedText) {
        matches.push({
          type: "italic",
          index: italicMatch.index,
          length: italicMatch[0].length,
          text: matchedText,
        });
      }
    }

    // 6. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/~~([\s\S]+?)~~/);
    if (strikeMatch && strikeMatch.index !== undefined && strikeMatch[1]) {
      matches.push({
        type: "strike",
        index: strikeMatch.index,
        length: strikeMatch[0].length,
        text: strikeMatch[1],
      });
    }

    // 7. Auto URL: http:// or https://
    const urlMatch = remaining.match(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/);
    if (urlMatch && urlMatch.index !== undefined && urlMatch[1]) {
      matches.push({
        type: "url",
        index: urlMatch.index,
        length: urlMatch[0].length,
        text: urlMatch[1],
      });
    }

    // 8. Telegram/social mention: @handle
    const mentionMatch = remaining.match(/(?:^|(?<=\s|\())@([a-zA-Z0-9_]{3,32})/);
    if (mentionMatch && mentionMatch.index !== undefined && mentionMatch[1] && mentionMatch[0]) {
      const matchIndex = mentionMatch[0].startsWith("@") ? mentionMatch.index : mentionMatch.index + 1;
      matches.push({
        type: "mention",
        index: matchIndex,
        length: mentionMatch[1].length + 1,
        text: mentionMatch[1],
      });
    }

    // Find the earliest match
    if (matches.length === 0) {
      results.push(remaining);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const earliest = matches[0];
    if (!earliest) {
      results.push(remaining);
      break;
    }

    // Push text before the match
    if (earliest.index > 0) {
      results.push(remaining.slice(0, earliest.index));
    }

    // Render the match
    const key = `inline-${keyCounter++}`;
    switch (earliest.type) {
      case "code":
        results.push(
          <code
            key={key}
            className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground border border-border/70"
          >
            {earliest.text}
          </code>,
        );
        break;

      case "link": {
        const url = earliest.extra || "";
        const isExternal = /^https?:\/\//i.test(url);
        const isSafe = !/^(javascript|data):/i.test(url);
        if (!isSafe) {
          results.push(earliest.text);
        } else {
          results.push(
            <a
              key={key}
              href={url}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:text-primary-deep transition-colors"
            >
              {parseInline(earliest.text)}
              {isExternal && <ExternalLink className="size-2.5 opacity-70 inline" />}
            </a>,
          );
        }
        break;
      }

      case "bold_italic":
        results.push(
          <strong key={key} className="font-bold italic text-foreground">
            {parseInline(earliest.text)}
          </strong>,
        );
        break;

      case "bold":
        results.push(
          <strong key={key} className="font-bold text-foreground">
            {parseInline(earliest.text)}
          </strong>,
        );
        break;

      case "italic":
        results.push(
          <em key={key} className="italic text-foreground/90">
            {parseInline(earliest.text)}
          </em>,
        );
        break;

      case "strike":
        results.push(
          <del key={key} className="line-through text-muted-foreground">
            {parseInline(earliest.text)}
          </del>,
        );
        break;

      case "url":
        results.push(
          <a
            key={key}
            href={earliest.text}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:text-primary-deep transition-colors break-all"
          >
            {earliest.text}
            <ExternalLink className="size-2.5 opacity-70 inline" />
          </a>,
        );
        break;

      case "mention":
        results.push(
          <a
            key={key}
            href={`https://t.me/${earliest.text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            @{earliest.text}
          </a>,
        );
        break;
    }

    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Code Block with Copy Feedback
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] hover:bg-background hover:text-foreground transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[11px] font-mono leading-relaxed text-foreground bg-background/50">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Component
// ---------------------------------------------------------------------------

interface TableBlockData {
  headers: string[];
  alignments: ("left" | "center" | "right")[];
  rows: string[][];
}

function TableRenderer({ data }: { data: TableBlockData }) {
  const getAlignClass = (align: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div className="my-2.5 w-full overflow-x-auto rounded-lg border border-border bg-card/70 shadow-xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-muted/80 border-b border-border font-semibold text-foreground">
          <tr>
            {data.headers.map((header, i) => (
              <th
                key={i}
                className={cn(
                  "px-3 py-2 text-xs font-bold whitespace-nowrap",
                  getAlignClass(data.alignments[i] || "left"),
                )}
              >
                {parseInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="hover:bg-muted/30 transition-colors odd:bg-transparent even:bg-muted/15"
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={cn(
                    "px-3 py-2 text-xs text-foreground/90 align-top leading-relaxed",
                    getAlignClass(data.alignments[cIdx] || "left"),
                  )}
                >
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block-Level Parser Types
// ---------------------------------------------------------------------------

type BlockNode =
  | { type: "heading"; level: number; text: string }
  | { type: "code_block"; code: string; language?: string | undefined }
  | { type: "table"; data: TableBlockData }
  | { type: "blockquote"; text: string }
  | { type: "divider" }
  | {
      type: "list";
      ordered: boolean;
      items: Array<{ text: string; indent: number; number?: string | undefined }>;
    }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(markdown: string): BlockNode[] {
  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    if (rawLine === undefined) {
      i++;
      continue;
    }
    const trimmed = rawLine.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Block
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const nextL = lines[i];
        if (nextL !== undefined && nextL.trim().startsWith("```")) {
          break;
        }
        if (nextL !== undefined) {
          codeLines.push(nextL);
        }
        i++;
      }
      if (i < lines.length) {
        i++; // consume closing backticks
      }
      blocks.push({
        type: "code_block",
        code: codeLines.join("\n"),
        language: language || undefined,
      });
      continue;
    }

    // 3. Tables (GFM syntax: Header | Row, separator |---|)
    const nextLineRaw = lines[i + 1];
    if (trimmed.includes("|") && nextLineRaw !== undefined) {
      const nextTrimmed = nextLineRaw.trim();
      const isSeparator =
        nextTrimmed.includes("|") &&
        nextTrimmed.includes("-") &&
        /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(nextTrimmed);

      if (isSeparator) {
        // Parse header
        const splitRow = (rowStr: string): string[] => {
          let s = rowStr.trim();
          if (s.startsWith("|")) s = s.slice(1);
          if (s.endsWith("|")) s = s.slice(0, -1);
          return s.split("|").map((cell) => cell.trim());
        };

        const headers = splitRow(trimmed);
        const sepCells = splitRow(nextTrimmed);
        const alignments: ("left" | "center" | "right")[] = sepCells.map((cell) => {
          const leftColon = cell.startsWith(":");
          const rightColon = cell.endsWith(":");
          if (leftColon && rightColon) return "center";
          if (rightColon) return "right";
          return "left";
        });

        const rows: string[][] = [];
        i += 2; // move past header & separator

        while (i < lines.length) {
          const rowLine = lines[i];
          if (rowLine === undefined || !rowLine.trim().includes("|") || rowLine.trim().length === 0) {
            break;
          }
          const cells = splitRow(rowLine);
          // Normalize row cells length to match header length
          while (cells.length < headers.length) cells.push("");
          rows.push(cells.slice(0, headers.length));
          i++;
        }

        blocks.push({
          type: "table",
          data: { headers, alignments, rows },
        });
        continue;
      }
    }

    // 4. Headings: # to ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2] !== undefined) {
      let headingText = headingMatch[2].trim();
      // If the heading is wrapped like ### **Our Core Programs**, unwrap the outer bold
      if (headingText.startsWith("**") && headingText.endsWith("**") && headingText.length >= 4) {
        headingText = headingText.slice(2, -2).trim();
      }

      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingText,
      });
      i++;
      continue;
    }

    // 5. Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // 6. Blockquote: > quote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const qLine = lines[i];
        if (qLine === undefined || !qLine.trim().startsWith(">")) {
          break;
        }
        quoteLines.push(qLine.trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // 7. Lists (Unordered * or - or +, and Ordered 1. 2.)
    const unorderedMatch = rawLine.match(/^(\s*)([*+-])\s+(.*)$/);
    const orderedMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (unorderedMatch || orderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      const listItems: Array<{ text: string; indent: number; number?: string | undefined }> = [];

      while (i < lines.length) {
        const line = lines[i];
        if (line === undefined) break;

        const uMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
        const oMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

        if (uMatch && uMatch[1] !== undefined && uMatch[3] !== undefined) {
          listItems.push({
            indent: Math.floor(uMatch[1].length / 2),
            text: uMatch[3],
          });
          i++;
        } else if (oMatch && oMatch[1] !== undefined && oMatch[2] !== undefined && oMatch[3] !== undefined) {
          listItems.push({
            indent: Math.floor(oMatch[1].length / 2),
            number: oMatch[2],
            text: oMatch[3],
          });
          i++;
        } else if (line.trim().length > 0 && /^\s{2,}/.test(line) && listItems.length > 0) {
          // Continuation line of previous list item
          const lastItem = listItems[listItems.length - 1];
          if (lastItem) {
            lastItem.text += `\n${line.trim()}`;
          }
          i++;
        } else {
          break;
        }
      }

      if (listItems.length > 0) {
        blocks.push({
          type: "list",
          ordered: isOrdered,
          items: listItems,
        });
      } else {
        i++;
      }
      continue;
    }

    // 8. Normal Paragraph
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const pLine = lines[i];
      if (pLine === undefined) break;
      const pTrim = pLine.trim();

      if (
        pTrim.length === 0 ||
        pTrim.startsWith("```") ||
        pTrim.match(/^#{1,6}\s/) ||
        pTrim.startsWith(">") ||
        pTrim.match(/^(\s*)([*+-]|\d+\.)\s/) ||
        pTrim.match(/^(\*{3,}|-{3,}|_{3,})$/) ||
        (pTrim.includes("|") && i + 1 < lines.length && (lines[i + 1]?.trim().includes("|") ?? false) && (lines[i + 1]?.trim().includes("-") ?? false))
      ) {
        break;
      }

      paragraphLines.push(pTrim);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join("\n"),
      });
    } else {
      i++;
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Main ChatMarkdown Component
// ---------------------------------------------------------------------------

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={cn("chat-markdown text-xs sm:text-sm leading-relaxed space-y-2 text-foreground/95", className)}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        switch (block.type) {
          case "heading": {
            if (block.level === 1) {
              return (
                <h2
                  key={key}
                  className="font-bold text-sm sm:text-base text-foreground mt-3 mb-1.5 pb-1 border-b border-border/50 flex items-center gap-1.5"
                >
                  {parseInline(block.text)}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3
                  key={key}
                  className="font-bold text-xs sm:text-sm text-foreground mt-2.5 mb-1 flex items-center gap-1.5"
                >
                  {parseInline(block.text)}
                </h3>
              );
            }
            // Level 3, 4, 5, 6
            return (
              <h4
                key={key}
                className="font-bold text-xs sm:text-sm text-foreground mt-2 mb-1 flex items-center gap-1.5"
              >
                {parseInline(block.text)}
              </h4>
            );
          }

          case "code_block":
            return <CodeBlock key={key} code={block.code} language={block.language} />;

          case "table":
            return <TableRenderer key={key} data={block.data} />;

          case "blockquote":
            return (
              <blockquote
                key={key}
                className="my-2 border-l-2 border-primary/70 bg-primary/5 pl-3 py-1.5 text-xs italic text-foreground/90 rounded-r"
              >
                {block.text.split("\n").map((line, lIdx) => (
                  <p key={lIdx} className={lIdx > 0 ? "mt-1" : ""}>
                    {parseInline(line)}
                  </p>
                ))}
              </blockquote>
            );

          case "divider":
            return <hr key={key} className="my-2.5 border-t border-border" />;

          case "list": {
            return (
              <ul key={key} className="my-1.5 space-y-1.5">
                {block.items.map((item, itemIdx) => {
                  const paddingLeft = item.indent > 0 ? `${item.indent * 1}rem` : undefined;

                  return (
                    <li
                      key={itemIdx}
                      style={{ paddingLeft }}
                      className="flex items-start gap-2 leading-relaxed"
                    >
                      {block.ordered && item.number ? (
                        <span className="shrink-0 font-semibold text-primary text-[11px] sm:text-xs min-w-[1rem] text-right">
                          {item.number}.
                        </span>
                      ) : (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        {item.text.split("\n").map((line, lIdx) => (
                          <span key={lIdx} className={lIdx > 0 ? "block mt-0.5" : "inline"}>
                            {parseInline(line)}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          }

          case "paragraph":
            return (
              <p key={key} className="leading-relaxed">
                {block.text.split("\n").map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {lIdx > 0 && <br />}
                    {parseInline(line)}
                  </React.Fragment>
                ))}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
