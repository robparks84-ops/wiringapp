// Lua runtime using fengari-web.
// IMPORTANT: This module must only be used client-side.
// Import via getLuaRuntime() inside useEffect or event handlers only.

export interface LuaRuntime {
  run(
    script: string,
    opts: {
      tickRateHz: number;
      getChannel: (name: string) => number;
      setChannel: (name: string, value: number) => void;
      readCAN: (index: number) => { id: number; extended: boolean; data: number[] } | null;
      txCAN: (index: number, id: number, extended: boolean, data: number[]) => void;
      onConsole: (line: string) => void;
      onError: (msg: string) => void;
      onStop: () => void;
    }
  ): void;
  stop(): void;
}

let runtimeInstance: LuaRuntimeImpl | null = null;

class LuaRuntimeImpl implements LuaRuntime {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(script: string, opts: Parameters<LuaRuntime['run']>[1]): void {
    this.stop();

    const tickMs = Math.round(1000 / opts.tickRateHz);

    // Dynamically load fengari-web at call time
    import('fengari-web').then((fengari) => {
      const {
        lua, lauxlib, lualib, to_jsstring, to_luastring,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = fengari as any;

      const L = lauxlib.luaL_newstate();
      lualib.luaL_openlibs(L);

      // Register RC API functions
      lua.lua_pushcfunction(L, (_L: unknown) => {
        const name = to_jsstring(lua.lua_tostring(L, 1));
        lua.lua_pushnumber(L, opts.getChannel(name));
        return 1;
      });
      lua.lua_setglobal(L, to_luastring('getChannel'));

      lua.lua_pushcfunction(L, (_L: unknown) => {
        const name = to_jsstring(lua.lua_tostring(L, 1));
        const value = lua.lua_tonumber(L, 2);
        opts.setChannel(name, value);
        return 0;
      });
      lua.lua_setglobal(L, to_luastring('setChannel'));

      lua.lua_pushcfunction(L, (_L: unknown) => {
        const msg = to_jsstring(lua.lua_tostring(L, 1));
        opts.onConsole(String(msg ?? ''));
        return 0;
      });
      lua.lua_setglobal(L, to_luastring('println'));

      lua.lua_pushcfunction(L, (_L: unknown) => {
        const index = lua.lua_tointeger(L, 1);
        const frame = opts.readCAN(index);
        if (!frame) {
          lua.lua_pushnil(L);
          return 1;
        }
        // Push table {id, extended, data={...}}
        lua.lua_newtable(L);
        lua.lua_pushnumber(L, frame.id);
        lua.lua_setfield(L, -2, to_luastring('id'));
        lua.lua_pushboolean(L, frame.extended ? 1 : 0);
        lua.lua_setfield(L, -2, to_luastring('extended'));
        lua.lua_newtable(L);
        for (let i = 0; i < 8; i++) {
          lua.lua_pushnumber(L, frame.data[i] ?? 0);
          lua.lua_rawseti(L, -2, i + 1);
        }
        lua.lua_setfield(L, -2, to_luastring('data'));
        return 1;
      });
      lua.lua_setglobal(L, to_luastring('readCAN'));

      lua.lua_pushcfunction(L, (_L: unknown) => {
        const index = lua.lua_tointeger(L, 1);
        const id = lua.lua_tointeger(L, 2);
        const extended = lua.lua_toboolean(L, 3) === 1;
        const data: number[] = [];
        for (let i = 1; i <= 8; i++) {
          lua.lua_rawgeti(L, 4, i);
          data.push(lua.lua_tointeger(L, -1) & 0xFF);
          lua.lua_pop(L, 1);
        }
        opts.txCAN(index, id, extended, data);
        return 0;
      });
      lua.lua_setglobal(L, to_luastring('txCAN'));

      // Load and execute the script
      const status = lauxlib.luaL_dostring(L, to_luastring(script));
      if (status !== lua.LUA_OK) {
        const err = to_jsstring(lua.lua_tostring(L, -1));
        opts.onError(`Script error: ${err}`);
        opts.onStop();
        return;
      }

      // Start tick loop
      this.intervalId = setInterval(() => {
        lua.lua_getglobal(L, to_luastring('onTick'));
        if (lua.lua_isfunction(L, -1)) {
          const ok = lua.lua_pcall(L, 0, 0, 0);
          if (ok !== lua.LUA_OK) {
            const err = to_jsstring(lua.lua_tostring(L, -1));
            opts.onError(`Runtime error: ${err}`);
            lua.lua_pop(L, 1);
            this.stop();
            opts.onStop();
          }
        } else {
          lua.lua_pop(L, 1);
        }
      }, tickMs);
    }).catch((err) => {
      opts.onError(`Failed to load Lua runtime: ${err?.message ?? err}`);
      opts.onStop();
    });
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export function getLuaRuntime(): LuaRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new LuaRuntimeImpl();
  }
  return runtimeInstance;
}
