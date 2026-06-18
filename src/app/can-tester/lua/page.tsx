'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useCallback, useEffect } from 'react';
import { LuaEditor } from '@/components/can-tester/lua/LuaEditor';
import { LuaConsole } from '@/components/can-tester/lua/LuaConsole';
import { LuaControls } from '@/components/can-tester/lua/LuaControls';
import { useCANStore } from '@/lib/can-tester/store';
import { getLuaRuntime } from '@/lib/can-tester/lua/runtime';

export default function LuaPage() {
  const luaState = useCANStore(s => s.luaState);
  const activeFrame = useCANStore(s => s.activeFrame);
  const appendConsole = useCANStore(s => s.appendConsole);
  const setLuaError = useCANStore(s => s.setLuaError);
  const setLuaRunning = useCANStore(s => s.setLuaRunning);
  const setChannelValue = useCANStore(s => s.setChannelValue);
  const getChannelValue = useCANStore(s => s.getChannelValue);
  const setFrameData = useCANStore(s => s.setFrameData);

  // Stop Lua when unmounting
  useEffect(() => {
    return () => {
      getLuaRuntime().stop();
    };
  }, []);

  const handleRun = useCallback(() => {
    const runtime = getLuaRuntime();
    setLuaError(null);
    setLuaRunning(true);

    runtime.run(luaState.scriptSource, {
      tickRateHz: luaState.tickRateHz,
      getChannel: (name) => getChannelValue(name),
      setChannel: (name, value) => setChannelValue(name, value),
      readCAN: (_index) => ({
        id: activeFrame.id,
        extended: activeFrame.extended,
        data: [...activeFrame.data],
      }),
      txCAN: (_index, _id, _extended, data) => {
        setFrameData(data);
      },
      onConsole: (line) => appendConsole(line),
      onError: (msg) => {
        setLuaError(msg);
        appendConsole(`[ERROR] ${msg}`);
      },
      onStop: () => setLuaRunning(false),
    });
  }, [luaState.scriptSource, luaState.tickRateHz, activeFrame]);

  function handleStop() {
    getLuaRuntime().stop();
    setLuaRunning(false);
  }

  return (
    <Stack gap="md">
      <Title order={3}>Lua Scripting</Title>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Write Lua scripts using the RaceCapture API. Channels from the <strong>Channel Map</strong> tab are available via{' '}
        <code>getChannel()</code> / <code>setChannel()</code>. The active frame from the <strong>Builder</strong> tab is accessible via <code>readCAN(0)</code>.
      </Alert>

      <LuaEditor />

      <LuaControls onRun={handleRun} onStop={handleStop} />

      <Text size="sm" fw={500}>Console</Text>
      <LuaConsole />
    </Stack>
  );
}
