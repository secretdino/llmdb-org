/**
 * ============================================================================
 * SECURE LIGHTWEIGHT SERVER-SIDE MARKDOWN-TO-HTML PARSER
 * ============================================================================
 * 
 * A custom markdown renderer built to ensure maximum execution speed, zero 
 * third-party dependency bloat, and total protection against Cross-Site Scripting (XSS).
 * 
 * It escapes raw user input HTML tags before translating markdown syntax rules.
 */

/**
 * Escapes standard HTML special characters to prevent script injection blocks.
 */
function escapeHtml(unsafeText: string): string {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Server-renders a markdown narrative block into clean, semantic HTML.
 * Supports paragraphs, lists, bold, italics, inline code, headers, and code blocks.
 */
export function renderMarkdownToHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";

  // Step 1: Escape all raw HTML to neutralize script injections
  let html = escapeHtml(markdown.trim());

  // Step 2: Handle code block sections (```code```)
  const codeBlockRegex = /```([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (_, codeContent) => {
    return `<pre class="bg-surface-0/80 border border-zinc-800 rounded-xl p-4 text-[11px] font-mono overflow-auto cyber-scrollbar my-4 whitespace-pre block"><code class="text-amber-300">${codeContent.trim()}</code></pre>`;
  });

  // Step 3: Handle inline code segments (`code`)
  const inlineCodeRegex = /`([^`]+)`/g;
  html = html.replace(inlineCodeRegex, (_, codeContent) => {
    return `<code class="bg-surface-0/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-accent-amber font-bold">${codeContent}</code>`;
  });

  // Step 4: Split into individual lines to compile structural elements (lists, headers)
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // End list block if line is empty or doesn't start with a bullet point
    if (inList && (!line || (!line.startsWith("- ") && !line.startsWith("* ")))) {
      processedLines.push("</ul>");
      inList = false;
    }

    if (!line) {
      // Preserve single empty line break
      processedLines.push("");
      continue;
    }

    // Headers processing
    if (line.startsWith("### ")) {
      processedLines.push(`<h4 class="text-sm font-heading font-extrabold text-white mt-4 mb-2">${line.slice(4)}</h4>`);
    } else if (line.startsWith("## ")) {
      processedLines.push(`<h3 class="text-base font-heading font-black text-white mt-6 mb-3">${line.slice(3)}</h3>`);
    } else if (line.startsWith("# ")) {
      processedLines.push(`<h2 class="text-lg font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight mt-8 mb-4">${line.slice(2)}</h2>`);
    } 
    // Unordered lists processing
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        processedLines.push('<ul class="list-disc pl-5 space-y-1.5 my-3 text-xs text-zinc-300 font-sans">');
        inList = true;
      }
      processedLines.push(`<li>${line.slice(2)}</li>`);
    } 
    // Standard paragraph block
    else {
      // If it doesn't match headers, lists, or code blocks, render as a text paragraph
      processedLines.push(`<p class="text-xs leading-relaxed text-zinc-400 my-2.5 font-sans">${line}</p>`);
    }
  }

  // Close list tag if it was left open at the EOF
  if (inList) {
    processedLines.push("</ul>");
  }

  let finalHtml = processedLines.join("\n");

  // Step 5: Handle inline bold emphasis emphasis (`**text**`)
  finalHtml = finalHtml.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Step 6: Handle inline italic emphasis emphasis (`*text*`)
  finalHtml = finalHtml.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return finalHtml;
}
