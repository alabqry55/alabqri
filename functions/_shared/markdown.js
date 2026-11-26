const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));

function renderInline(value) {
  const code = [];
  let source = String(value ?? "").replace(/`([^`]+)`/g, (_, text) => {
    const token = String.fromCharCode(0xE000 + code.length);
    code.push("<code>" + escapeHtml(text) + "</code>");
    return token;
  });
  source = escapeHtml(source);
  source = source
    .replace(/**(.+?)**/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])*([^*\n]+)*/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  return source.replace(/[\uE000-\uF8FF]/g, token => {
    const index = token.charCodeAt(0) - 0xE000;
    return code[index] ?? "";
  });
}

export function renderMarkdown(input) {
  const lines = String(input ?? "").replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  let quote = [];
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push("<p>" + paragraph.map(renderInline).join("<br>") + "</p>");
    paragraph = [];
  };
  const closeList = () => {
    if (listType) output.push("</" + listType + ">");
    listType = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    output.push("<blockquote>" + quote.map(line => "<p>" + renderInline(line) + "</p>").join("") + "</blockquote>");
    quote = [];
  };

  for (const line of lines) {
    const fence = line.match(/^\s*```/);
    if (code !== null) {
      if (fence) {
        output.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        code = null;
      } else code.push(line);
      continue;
    }
    if (fence) {
      flushParagraph(); closeList(); flushQuote();
      code = [];
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoteLine = line.match(/^\s*>\s?(.*)$/);
    const thematic = /^\s*(?:---+|___+|\*\s*\*\s*\*+)\s*$/.test(line);

    if (!line.trim()) {
      flushParagraph(); closeList(); flushQuote();
    } else if (heading) {
      flushParagraph(); closeList(); flushQuote();
      const level = heading[1].length;
      output.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
    } else if (thematic) {
      flushParagraph(); closeList(); flushQuote();
      output.push("<hr>");
    } else if (quoteLine) {
      flushParagraph(); closeList();
      quote.push(quoteLine[1]);
    } else if (unordered || ordered) {
      flushParagraph(); flushQuote();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        output.push("<" + nextType + ">");
        listType = nextType;
      }
      output.push("<li>" + renderInline((unordered || ordered)[1]) + "</li>");
    } else {
      closeList(); flushQuote();
      paragraph.push(line);
    }
  }
  if (code !== null) output.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
  flushParagraph(); closeList(); flushQuote();
  return output.join("\n");
}
