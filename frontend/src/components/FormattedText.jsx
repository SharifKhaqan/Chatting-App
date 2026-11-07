import React from "react";

// Formats Markdown syntax (bold, italic, inline code, code blocks, lists, headers)
// into clean, beautiful HTML elements for chat messages
const FormattedText = ({ text }) => {
  if (!text) return null;

  // Split content by lines
  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  // Helper to parse inline markdown: **bold**, `code`, *italic*
  const renderInline = (str) => {
    if (!str) return null;
    const inlineRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = str.split(inlineRegex);

    return parts.map((part, i) => {
      // Bold: **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Inline Code: `code`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 bg-black/10 rounded font-mono text-xs text-indigo-700 font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Italic: *text*
      if (
        part.startsWith("*") &&
        part.endsWith("*") &&
        part.length >= 2 &&
        !part.startsWith("**")
      ) {
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Multi-line code block: ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs font-mono"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // List item: * item or - item or 1. item
    const isListItem = /^[*\-•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);

    if (!isListItem && currentList.length > 0) {
      elements.push(
        <ul key={`list-${index}`} className="my-1.5 pl-5 space-y-1 list-disc text-sm">
          {currentList.map((item, liIdx) => (
            <li key={liIdx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }

    if (isListItem) {
      const cleanItem = trimmed.replace(/^[*\-•]\s+|\d+\.\s+/, "");
      currentList.push(cleanItem);
      return;
    }

    // Headings: #, ##, ###
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="font-bold text-sm text-gray-900 mt-2 mb-1">
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="font-bold text-base text-gray-900 mt-2.5 mb-1">
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="font-bold text-lg text-gray-900 mt-3 mb-1.5">
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h1>
      );
      return;
    }

    // Horizontal Rule: ---
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={index} className="my-2 border-gray-300" />);
      return;
    }

    // Empty line -> paragraph break
    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    // Normal line
    elements.push(
      <p key={index} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });

  // Flush remaining list items
  if (currentList.length > 0) {
    elements.push(
      <ul key="list-end" className="my-1.5 pl-5 space-y-1 list-disc text-sm">
        {currentList.map((item, liIdx) => (
          <li key={liIdx}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }

  // Flush unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="code-end"
        className="my-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs font-mono"
      >
        <code>{codeBlockLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="space-y-1 text-sm break-words">{elements}</div>;
};

export default FormattedText;
