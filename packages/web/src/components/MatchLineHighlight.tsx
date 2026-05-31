import type { ReactNode } from "react";
import type { CaptureSpan } from "@grokparse/core";

const TYPE_COLORS: Record<string, string> = {
  int: "#dbeafe",
  float: "#dbeafe",
  ipv4: "#dcfce7",
  ipv6: "#dcfce7",
  ip: "#dcfce7",
  date: "#fef3c7",
  datetime: "#fef3c7",
  email: "#fce7f3",
  uri: "#e0e7ff",
  uuid: "#f3e8ff",
  mac: "#ccfbf1",
  bool: "#fee2e2",
  string: "#f4f4f5",
};

export function MatchLineHighlight({
  line,
  spans,
}: {
  line: string;
  spans: CaptureSpan[];
}) {
  if (!spans.length) return <code>{line}</code>;

  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const span of sorted) {
    if (span.start > cursor) {
      parts.push(
        <span key={`t-${cursor}`}>{line.slice(cursor, span.start)}</span>,
      );
    }
    parts.push(
      <mark
        key={`${span.name}-${span.start}`}
        className="capture-highlight"
        style={{ background: TYPE_COLORS[span.type] ?? TYPE_COLORS.string }}
        title={`${span.name}: ${span.type}`}
      >
        {line.slice(span.start, span.end)}
      </mark>,
    );
    cursor = span.end;
  }
  if (cursor < line.length) {
    parts.push(<span key={`t-end`}>{line.slice(cursor)}</span>);
  }

  return <code className="highlighted-line">{parts}</code>;
}
