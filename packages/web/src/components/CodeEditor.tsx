import {
  forwardRef,
  lazy,
  Suspense,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";

const Monaco = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

export interface CodeEditorHandle {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

interface CodeEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  language?: string;
}

export const CodeEditor = forwardRef(function CodeEditor(
  { id, label, value, onChange, rows = 6, language = "plaintext" }: CodeEditorProps,
  ref: Ref<CodeEditorHandle>,
) {
  return (
    <Suspense
      fallback={
        <TextFallback
          id={id}
          label={label}
          value={value}
          onChange={onChange}
          rows={rows}
          ref={ref}
        />
      }
    >
      <MonacoEditorInner
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        rows={rows}
        language={language}
        ref={ref}
      />
    </Suspense>
  );
});

const TextFallback = forwardRef(function TextFallback(
  { id, label, value, onChange, rows = 6 }: CodeEditorProps,
  ref: Ref<CodeEditorHandle>,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    insertAtCursor(text: string) {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + text + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + text.length;
        el.setSelectionRange(pos, pos);
      });
    },
    focus() {
      textareaRef.current?.focus();
    },
  }));

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="code-fallback"
      />
    </>
  );
});

const MonacoEditorInner = forwardRef(function MonacoEditorInner(
  { id, label, value, onChange, rows = 6, language = "plaintext" }: CodeEditorProps,
  ref: Ref<CodeEditorHandle>,
) {
  const editorInstance = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(
    null,
  );
  const height = Math.max(80, rows * 22);

  useImperativeHandle(ref, () => ({
    insertAtCursor(text: string) {
      const ed = editorInstance.current;
      if (!ed) {
        onChange(value + text);
        return;
      }
      const sel = ed.getSelection();
      if (!sel) return;
      ed.executeEdits("insert", [{ range: sel, text, forceMoveMarkers: true }]);
      ed.focus();
    },
    focus() {
      editorInstance.current?.focus();
    },
  }));

  const labelId = `${id}-label`;

  return (
    <div className="monaco-wrap" role="group" aria-labelledby={labelId}>
      <label id={labelId} htmlFor={id}>
        {label}
      </label>
      <input
        type="text"
        id={id}
        className="sr-only"
        value={value}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
      />
      <Monaco
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={(editor) => {
          editorInstance.current = editor;
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "off",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 8, bottom: 8 },
          ariaLabel: label,
        }}
        theme="vs"
      />
    </div>
  );
});
