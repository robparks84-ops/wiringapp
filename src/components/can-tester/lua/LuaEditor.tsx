'use client';

import { useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mantine/core';
import dynamic from 'next/dynamic';
import { useCANStore } from '@/lib/can-tester/store';
import { RC_COMPLETIONS } from '@/lib/can-tester/lua/apiStubs';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  { ssr: false, loading: () => <Skeleton height={300} radius="sm" /> }
);

export function LuaEditor() {
  const scriptSource = useCANStore(s => s.luaState.scriptSource);
  const setLuaScript = useCANStore(s => s.setLuaScript);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorMount(editor: any, monaco: any) {
    monacoRef.current = monaco;

    // Register RaceCapture Lua completions
    monaco.languages.registerCompletionItemProvider('lua', {
      provideCompletionItems: () => ({
        suggestions: RC_COMPLETIONS.map(item => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.label,
        })),
      }),
    });
  }

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <MonacoEditor
        height={typeof window !== 'undefined' && window.innerWidth < 500 ? 250 : 380}
        language="lua"
        theme="vs-dark"
        value={scriptSource}
        onChange={v => setLuaScript(v ?? '')}
        onMount={handleEditorMount}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          lineNumbers: 'on',
        }}
      />
    </Box>
  );
}
