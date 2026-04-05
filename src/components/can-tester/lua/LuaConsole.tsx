'use client';

import { ScrollArea, Text, Box, Code } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { useCANStore } from '@/lib/can-tester/store';

export function LuaConsole() {
  const { consoleLines, lastError } = useCANStore(s => s.luaState);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLines.length]);

  return (
    <Box
      style={{
        background: 'var(--mantine-color-dark-8, #1a1b1e)',
        borderRadius: 6,
        border: '1px solid var(--mantine-color-default-border)',
        padding: '8px 10px',
      }}
    >
      <ScrollArea h={{ base: 180, sm: 260 }} type="auto">
        {consoleLines.length === 0 && !lastError && (
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            -- console output appears here --
          </Text>
        )}
        {consoleLines.map((line, i) => (
          <Text
            key={i}
            size="xs"
            style={{ fontFamily: 'monospace', color: '#a9dc76', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
            {line}
          </Text>
        ))}
        {lastError && (
          <Text
            size="xs"
            style={{ fontFamily: 'monospace', color: '#ff6b6b', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
            {lastError}
          </Text>
        )}
        <div ref={bottomRef} />
      </ScrollArea>
    </Box>
  );
}
