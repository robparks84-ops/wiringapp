export const DEFAULT_LUA_SCRIPT = `-- RaceCapture / CAN Tester Lua Example
-- Available API:
--   getChannel(name)           -> number
--   setChannel(name, value)    -> nil
--   println(msg)               -> nil  (appears in console below)
--   readCAN(index)             -> table {id, extended, data}  (8-element array)
--   txCAN(index, id, ext, data) -> nil  (updates frame in Builder tab)

local tick = 0

function onTick()
  tick = tick + 1

  -- Read a channel (must exist in Channel Map tab)
  local rpm = getChannel("RPM")
  local coolant = getChannel("Coolant")

  -- Log every 10 ticks
  if tick % 10 == 0 then
    println("Tick " .. tick .. " | RPM: " .. string.format("%.0f", rpm) ..
            " | CLT: " .. string.format("%.1f", coolant) .. "°C")
  end

  -- Example: read active CAN frame from Builder tab
  local frame = readCAN(0)
  if frame then
    -- frame.id = CAN ID, frame.data = {byte0, byte1, ...byte7}
  end

  -- Example: write back a derived channel
  setChannel("RPM_Display", rpm * 0.001)
end
`;

// Monaco editor completion items for RaceCapture Lua API
export const RC_COMPLETIONS = [
  { label: 'getChannel', detail: 'getChannel(name: string) -> number', documentation: 'Read a channel value by name. Channel must be defined in the Channel Map tab.' },
  { label: 'setChannel', detail: 'setChannel(name: string, value: number)', documentation: 'Write a channel value. Affects the dashboard display.' },
  { label: 'println', detail: 'println(msg: string)', documentation: 'Print a message to the console output.' },
  { label: 'onTick', detail: 'function onTick()', documentation: 'Called periodically at the configured tick rate (default 10 Hz). Define this function to run your logic.' },
  { label: 'readCAN', detail: 'readCAN(index: number) -> table', documentation: 'Read the active CAN frame from the Builder tab. Returns {id, extended, data} where data is an 8-element array of bytes.' },
  { label: 'txCAN', detail: 'txCAN(index: number, id: number, extended: boolean, data: table)', documentation: 'Send (simulate) a CAN frame. Updates the active frame in the Builder tab.' },
];
