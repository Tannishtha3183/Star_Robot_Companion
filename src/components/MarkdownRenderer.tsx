import React from "react";

interface MarkdownRendererProps {
  text: string;
  isDark?: boolean;
}

interface TableBlockData {
  startIndex: number;
  endIndex: number;
  headers: string[];
  rows: string[][];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, isDark = true }) => {
  if (!text) return null;

  // Split text into lines
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  // Helper to parse inline styles (**bold**, *italics*, `code`)
  const parseInlineStyles = (content: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let state = content;
    let keyIdx = 0;
    let textAccumulator = "";

    const flushText = () => {
      if (textAccumulator) {
        parts.push(
          <span key={`txt-${keyIdx++}`}>
            {textAccumulator}
          </span>
        );
        textAccumulator = "";
      }
    };

    while (state.length > 0) {
      // Bold **text**
      const boldMatch = state.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
         flushText();
         parts.push(
           <strong key={`b-${keyIdx++}`} className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
             {boldMatch[1]}
           </strong>
         );
         state = state.slice(boldMatch[0].length);
         continue;
      }

      // Italics *text*
      const italicMatch = state.match(/^\*([^*]+)\*/);
      if (italicMatch) {
         flushText();
         parts.push(<em key={`i-${keyIdx++}`} className="italic text-inherit">{italicMatch[1]}</em>);
         state = state.slice(italicMatch[0].length);
         continue;
      }

      // Inline code `code`
      const inlineCodeMatch = state.match(/^`([^`]+)`/);
      if (inlineCodeMatch) {
         flushText();
         parts.push(
           <code key={`c-${keyIdx++}`} className={`px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap ${
             isDark ? "bg-meadow-bg/80 border border-meadow-pine/20 text-meadow-cream" : "bg-slate-100 border border-slate-200 text-slate-800"
           }`}>
             {inlineCodeMatch[1]}
           </code>
         );
         state = state.slice(inlineCodeMatch[0].length);
         continue;
      }

      // Plain character
      textAccumulator += state[0];
      state = state.slice(1);
    }

    flushText();
    return parts;
  };

  // Scan lines to find Markdown Table Blocks
  const findTableBlocks = (scrLines: string[]): TableBlockData[] => {
    const blocks: TableBlockData[] = [];
    const n = scrLines.length;
    let i = 0;

    while (i < n) {
      const line = scrLines[i].trim();
      // Check if current line starts and ends with "|" and has some content, and is not a separator
      if (line.startsWith("|") && line.endsWith("|") && i + 1 < n) {
        const nextLine = scrLines[i + 1].trim();
        
        // Check if nextLine is a separator
        const body = nextLine.startsWith("|") && nextLine.endsWith("|") ? nextLine.slice(1, -1) : "";
        const isSeparator = body && /^[:\-\s|]+$/.test(body) && body.includes("-");

        if (isSeparator) {
          const startIndex = i;

          const splitRow = (rowText: string): string[] => {
            const rawCells = rowText.trim().split("|");
            let cells = [...rawCells];
            if (rowText.trim().startsWith("|")) cells.shift();
            if (rowText.trim().endsWith("|")) cells.pop();
            return cells.map(c => c.trim());
          };

          const headers = splitRow(line);
          const rows: string[][] = [];

          let r = i + 2;
          while (r < n) {
            const rowLine = scrLines[r].trim();
            if (rowLine.startsWith("|") && rowLine.endsWith("|")) {
              rows.push(splitRow(rowLine));
              r++;
            } else {
              break;
            }
          }

          blocks.push({
            startIndex,
            endIndex: r - 1,
            headers,
            rows
          });

          i = r;
          continue;
        }
      }
      i++;
    }
    return blocks;
  };

  const tableBlocks = findTableBlocks(lines);

  // Helper arrays for list flushing
  let currentList: { items: string[]; type: "bullet" | "numbered" } | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = (key: string | number) => {
    if (currentList) {
      if (currentList.type === "bullet") {
        elements.push(
          <ul key={`ul-${key}`} className="list-none my-3 pl-1 space-y-1.5">
            {currentList.items.map((item, idx) => (
              <li key={`ul-li-${idx}`} className="flex items-start gap-2.5 text-xs">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  isDark ? "bg-meadow-moss" : "bg-sunset-rose"
                }`} />
                <span className="flex-1">{parseInlineStyles(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal my-3 pl-6 space-y-1.5 text-xs">
            {currentList.items.map((item, idx) => (
              <li key={`ol-li-${idx}`} className="pl-1">
                {parseInlineStyles(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  let idx = 0;
  while (idx < lines.length) {
    // Check if index is part of a Markdown Table block
    const matchingTableBlock = tableBlocks.find(b => idx >= b.startIndex && idx <= b.endIndex);
    if (matchingTableBlock) {
      flushList(idx);
      if (inCodeBlock) {
        inCodeBlock = false;
      }

      elements.push(
        <div key={`table-${matchingTableBlock.startIndex}`} className={`my-4 overflow-x-auto rounded-xl border transition-all duration-300 ${
          isDark ? "border-meadow-pine/25 bg-meadow-card/45 shadow-lg text-meadow-cream" : "border-slate-200 bg-white shadow-xs text-slate-800"
        }`}>
          <table className="min-w-full text-xs text-left border-collapse">
            <thead className={`font-mono text-[10px] uppercase tracking-wider ${
              isDark ? "bg-meadow-bg/60 text-meadow-sage border-b border-meadow-pine/20" : "bg-slate-100/90 text-slate-700 border-b border-slate-200"
            }`}>
              <tr>
                {matchingTableBlock.headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-4 py-2.5 font-semibold text-inherit">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-meadow-pine/10" : "divide-slate-200"}`}>
              {matchingTableBlock.rows.map((row, rIdx) => (
                <tr key={rIdx} className={isDark ? "hover:bg-meadow-bg/20 text-meadow-cream/90" : "hover:bg-slate-50 text-slate-700"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 font-sans align-middle">{parseInlineStyles(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      idx = matchingTableBlock.endIndex + 1;
      continue;
    }

    // Process normal line of markdown
    const line = lines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      idx++;
      continue;
    }

    // Code block toggle
    if (trimmed.startsWith("```")) {
      flushList(idx);
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`} className={`p-3 rounded-xl font-mono text-[10.5px] overflow-x-auto my-3 border ${
            isDark ? "bg-meadow-bg/90 border-meadow-pine/20 text-emerald-400" : "bg-slate-50 border-slate-200 text-slate-800"
          }`}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      idx++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      idx++;
      continue;
    }

    // Heading tags
    if (trimmed.startsWith("### ")) {
      flushList(idx);
      elements.push(
        <h4 key={`h-${idx}`} className={`text-xs uppercase tracking-widest mt-5 mb-2 font-bold font-mono ${
          isDark ? "text-white" : "text-slate-800"
        }`}>
          {trimmed.slice(4)}
        </h4>
      );
      idx++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList(idx);
      elements.push(
        <h3 key={`h-${idx}`} className={`text-sm font-display font-semibold tracking-tight mt-6 mb-3 ${
          isDark ? "text-white" : "text-slate-800"
        }`}>
          {trimmed.slice(3)}
        </h3>
      );
      idx++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList(idx);
      elements.push(
        <h2 key={`h-${idx}`} className={`text-base font-display font-bold tracking-tight mt-7 mb-4 ${
          isDark ? "text-white" : "text-slate-900"
        }`}>
          {trimmed.slice(2)}
        </h2>
      );
      idx++;
      continue;
    }

    // Bullet list parse
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const itemText = trimmed.slice(2);
      if (!currentList) {
        currentList = { items: [itemText], type: "bullet" };
      } else if (currentList.type === "bullet") {
        currentList.items.push(itemText);
      } else {
        flushList(idx);
        currentList = { items: [itemText], type: "bullet" };
      }
      idx++;
      continue;
    }

    // Numbered list parse
    const numberedMatch = trimmed.match(/^\d+\.\s(.*)/);
    if (numberedMatch) {
      const itemText = numberedMatch[1];
      if (!currentList) {
        currentList = { items: [itemText], type: "numbered" };
      } else if (currentList.type === "numbered") {
        currentList.items.push(itemText);
      } else {
        flushList(idx);
        currentList = { items: [itemText], type: "numbered" };
      }
      idx++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList(idx);
      elements.push(
        <blockquote key={`q-${idx}`} className={`border-l-2 pl-3.5 italic my-3 ${
          isDark ? "border-meadow-pine text-meadow-sage" : "border-sunset-rose text-slate-500"
        }`}>
          {parseInlineStyles(trimmed.slice(2))}
        </blockquote>
      );
      idx++;
      continue;
    }

    // Standard paragraph element
    flushList(idx);
    elements.push(
      <p key={`p-${idx}`} className={`text-xs leading-relaxed my-2.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        {parseInlineStyles(trimmed)}
      </p>
    );

    idx++;
  }

  flushList("final");

  return <div className="space-y-1.5 font-sans w-full max-w-full overflow-hidden text-slate-300 mb-1">{elements}</div>;
};
