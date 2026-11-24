import React, { ReactNode, ReactElement } from "react";

/**
 * Recursively extracts plain text from a React node tree.
 * Must run in the server component that owns the code element: once the tree
 * is serialized to a client component, React 19 turns long child arrays into
 * lazy chunks that cannot be read synchronously.
 */
function extractTextContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }

  if (React.isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    return extractTextContent(element.props.children);
  }

  return "";
}

export function countCodeLines(children: ReactNode): number {
  const text = extractTextContent(children);
  if (!text) return 1;
  const trimmed = text.endsWith("\n") ? text.slice(0, -1) : text;
  return trimmed.split("\n").length;
}
