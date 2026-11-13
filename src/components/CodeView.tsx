import { useLayoutEffect, useRef, useState } from 'react';

interface CodeViewProps {
  code: string;
  isStreaming: boolean;
}

export function CodeView({ code, isStreaming }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const block = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    if (isStreaming && block.current) block.current.scrollTop = block.current.scrollHeight;
  }, [code, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <div className="panel-header">
        <h3>코드</h3>
        <button className="btn-copy" onClick={handleCopy} disabled={isStreaming}>
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <pre className="code-block" ref={block}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
