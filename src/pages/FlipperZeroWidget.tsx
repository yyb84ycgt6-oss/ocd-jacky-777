import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bluetooth, Download, Shield, Wifi } from "lucide-react";
import { toast } from "sonner";

type FlipperTool = {
  id: string;
  name: string;
  category: string;
  summary: string;
  asset: string;
};

type ToolGuide = {
  setup: string[];
  operate: string[];
  verify: string[];
  safety: string[];
};

const FLIPPER_TOOLS: FlipperTool[] = [
  { id: "subghz-scanner", name: "Sub-GHz Signal Scanner", category: "radio", summary: "Scan nearby Sub-GHz signals and save captures.", asset: "/assets/flipper-tools/01-sub-ghz-signal-scanner.json" },
  { id: "subghz-replay", name: "Sub-GHz Signal Replay", category: "radio", summary: "Replay saved Sub-GHz captures for testing flows.", asset: "/assets/flipper-tools/02-sub-ghz-signal-replay.json" },
  { id: "rfid-read", name: "RFID 125kHz Reader", category: "rfid", summary: "Read and store 125kHz RFID cards.", asset: "/assets/flipper-tools/03-rfid-125khz-reader.json" },
  { id: "rfid-write", name: "RFID 125kHz Writer", category: "rfid", summary: "Write supported 125kHz RFID credentials.", asset: "/assets/flipper-tools/04-rfid-125khz-writer.json" },
  { id: "nfc-read", name: "NFC Reader", category: "nfc", summary: "Read NFC tags and card metadata.", asset: "/assets/flipper-tools/05-nfc-reader.json" },
  { id: "nfc-emulate", name: "NFC Card Emulation", category: "nfc", summary: "Emulate supported NFC card profiles.", asset: "/assets/flipper-tools/06-nfc-card-emulation.json" },
  { id: "mifare-inspector", name: "MIFARE Classic Inspector", category: "nfc", summary: "Inspect MIFARE Classic sectors for authorized testing.", asset: "/assets/flipper-tools/07-mifare-classic-inspector.json" },
  { id: "ibutton-reader", name: "iButton Reader", category: "ibutton", summary: "Read iButton keys and identifiers.", asset: "/assets/flipper-tools/08-ibutton-reader.json" },
  { id: "ibutton-emulation", name: "iButton Emulation", category: "ibutton", summary: "Emulate saved iButton identities.", asset: "/assets/flipper-tools/09-ibutton-emulation.json" },
  { id: "ir-learner", name: "Infrared Signal Learner", category: "infrared", summary: "Capture infrared signals from remotes.", asset: "/assets/flipper-tools/10-infrared-signal-learner.json" },
  { id: "ir-library", name: "Infrared Universal Library", category: "infrared", summary: "Browse and transmit known IR profiles.", asset: "/assets/flipper-tools/11-infrared-universal-library.json" },
  { id: "ir-raw", name: "Infrared Raw Transmitter", category: "infrared", summary: "Transmit custom/raw infrared patterns.", asset: "/assets/flipper-tools/12-infrared-raw-transmitter.json" },
  { id: "ble-scanner", name: "Bluetooth LE Device Scanner", category: "bluetooth", summary: "Discover nearby BLE devices.", asset: "/assets/flipper-tools/13-bluetooth-le-device-scanner.json" },
  { id: "ble-info", name: "Bluetooth LE Device Info", category: "bluetooth", summary: "Inspect BLE advertisement and device info.", asset: "/assets/flipper-tools/14-bluetooth-le-device-info.json" },
  { id: "u2f", name: "U2F Security Key Mode", category: "security", summary: "Use Flipper as a hardware auth token where supported.", asset: "/assets/flipper-tools/15-u2f-security-key-mode.json" },
  { id: "badusb-injector", name: "BadUSB Text Injector", category: "usb", summary: "Run approved keyboard automation scripts.", asset: "/assets/flipper-tools/16-badusb-text-injector.json" },
  { id: "badusb-shortcuts", name: "BadUSB Shortcut Launcher", category: "usb", summary: "Trigger approved shortcut sequences for workflows.", asset: "/assets/flipper-tools/17-badusb-shortcut-launcher.json" },
  { id: "gpio-monitor", name: "GPIO Pin Monitor", category: "gpio", summary: "Live monitor GPIO pin states.", asset: "/assets/flipper-tools/18-gpio-pin-monitor.json" },
  { id: "logic-analyzer", name: "GPIO Logic Analyzer", category: "gpio", summary: "Capture and inspect digital signal timing.", asset: "/assets/flipper-tools/19-gpio-logic-analyzer.json" },
  { id: "i2c-scanner", name: "I2C Bus Scanner", category: "gpio", summary: "Detect devices on connected I2C bus.", asset: "/assets/flipper-tools/20-i2c-bus-scanner.json" },
  { id: "spi-probe", name: "SPI Bus Probe", category: "gpio", summary: "Probe SPI communication lines.", asset: "/assets/flipper-tools/21-spi-bus-probe.json" },
  { id: "uart-terminal", name: "UART Serial Terminal", category: "serial", summary: "Connect to UART devices for serial console.", asset: "/assets/flipper-tools/22-uart-serial-terminal.json" },
  { id: "can-monitor", name: "CAN Bus Monitor (Module)", category: "automotive", summary: "Monitor CAN frames with compatible module.", asset: "/assets/flipper-tools/23-can-bus-monitor-module.json" },
  { id: "wifi-scanner", name: "Wi-Fi Devboard Scanner", category: "wifi", summary: "Scan Wi-Fi networks with supported devboard add-on.", asset: "/assets/flipper-tools/24-wi-fi-devboard-scanner.json" },
  { id: "wifi-packet", name: "Wi-Fi Packet Monitor", category: "wifi", summary: "Monitor packet activity with supported devboard firmware.", asset: "/assets/flipper-tools/25-wi-fi-packet-monitor.json" },
  { id: "frequency-analyzer", name: "Frequency Analyzer", category: "radio", summary: "Analyze frequency activity by band.", asset: "/assets/flipper-tools/26-frequency-analyzer.json" },
  { id: "signal-meter", name: "Signal Level Meter", category: "radio", summary: "Measure and compare capture signal strength.", asset: "/assets/flipper-tools/27-signal-level-meter.json" },
  { id: "file-manager", name: "File Manager", category: "system", summary: "Manage on-device files and folders.", asset: "/assets/flipper-tools/28-file-manager.json" },
  { id: "firmware-updater", name: "Firmware Updater", category: "system", summary: "Update Flipper firmware packages safely.", asset: "/assets/flipper-tools/29-firmware-updater.json" },
  { id: "plugin-manager", name: "Plugin Manager", category: "system", summary: "Enable/disable and organize installed plugins.", asset: "/assets/flipper-tools/30-plugin-manager.json" },
];

const FLIPPER_BASE_GUIDE = [
  "Charge Flipper Zero, update firmware, and back up your SD card before use.",
  "Use only authorized devices/signals and keep logs of test scope.",
  "Enable Bluetooth/network only when needed and disable after sessions.",
  "Export captured files to cloud storage with clear project labels.",
  "After each session, remove stale captures and rotate sensitive configs.",
];

const CATEGORY_GUIDES: Record<string, ToolGuide> = {
  radio: {
    setup: ["Set correct region/frequency rules.", "Attach required antenna/module."],
    operate: ["Start scan/capture mode.", "Label and save captures with context."],
    verify: ["Compare frequency/power levels against expected baseline."],
    safety: ["Do not transmit on unauthorized or restricted frequencies."],
  },
  rfid: {
    setup: ["Open RFID app and verify card compatibility."],
    operate: ["Read credential.", "Write/emulate only approved test credentials."],
    verify: ["Validate read/write using test reader endpoint."],
    safety: ["Never duplicate credentials without explicit authorization."],
  },
  nfc: {
    setup: ["Enable NFC mode and choose tag/card type."],
    operate: ["Read card metadata.", "Emulate profiles only in test environment."],
    verify: ["Confirm UID/data with baseline reader results."],
    safety: ["Avoid handling production payment/access cards."],
  },
  ibutton: {
    setup: ["Select iButton mode and clean contact surfaces."],
    operate: ["Read key ID.", "Emulate key in approved endpoint."],
    verify: ["Confirm key ID and access behavior in test rig."],
    safety: ["Do not use on unauthorized entry systems."],
  },
  infrared: {
    setup: ["Point receiver/transmitter correctly."],
    operate: ["Learn signal.", "Replay from saved profile."],
    verify: ["Check command success and response latency."],
    safety: ["Use only on equipment you own or are authorized to test."],
  },
  bluetooth: {
    setup: ["Enable Bluetooth and keep device near target."],
    operate: ["Scan nearby devices.", "Inspect advertisements/services."],
    verify: ["Confirm discovered device IDs in expected inventory."],
    safety: ["Do not attempt unauthorized pairing or data extraction."],
  },
  security: {
    setup: ["Register security mode with supported service."],
    operate: ["Run challenge flow and complete authentication."],
    verify: ["Validate auth logs and fallback behavior."],
    safety: ["Protect recovery keys and enrollment codes."],
  },
  usb: {
    setup: ["Open approved script/profile."],
    operate: ["Inject sequence in isolated test host."],
    verify: ["Confirm script output and timing accuracy."],
    safety: ["Never run untrusted payloads on production machines."],
  },
  gpio: {
    setup: ["Wire pins based on target board pinout."],
    operate: ["Start monitor/analyzer/probe mode."],
    verify: ["Compare captured waveforms against expected protocol."],
    safety: ["Check voltage levels before connecting pins."],
  },
  serial: {
    setup: ["Set UART baud/format to target values."],
    operate: ["Open terminal and capture session output."],
    verify: ["Confirm prompt/response consistency."],
    safety: ["Do not send destructive commands to unknown devices."],
  },
  automotive: {
    setup: ["Use compatible CAN module and safe test harness."],
    operate: ["Read frames and apply filters."],
    verify: ["Validate frame IDs and timing against docs."],
    safety: ["Do not test on active road vehicles."],
  },
  wifi: {
    setup: ["Install supported Wi-Fi devboard firmware."],
    operate: ["Run scan/monitor routines in test area."],
    verify: ["Match SSID/channel/packet stats with expected data."],
    safety: ["Follow local laws and authorized network scopes only."],
  },
  system: {
    setup: ["Back up files/config before changes."],
    operate: ["Run file/firmware/plugin operations."],
    verify: ["Confirm integrity checks and restart health."],
    safety: ["Keep recovery package available before updates."],
  },
};

export default function FlipperZeroWidget() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [bluetoothAvailable, setBluetoothAvailable] = useState(() => typeof navigator !== "undefined" && "bluetooth" in navigator);
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [toolQuery, setToolQuery] = useState("");
  const [llmPrompt, setLlmPrompt] = useState("");
  const [selectedToolId, setSelectedToolId] = useState(FLIPPER_TOOLS[0].id);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    setBluetoothAvailable("bluetooth" in navigator);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const connectFlipper = async () => {
    const bt = (navigator as Navigator & {
      bluetooth?: { requestDevice: (options: { acceptAllDevices: boolean; optionalServices?: number[] }) => Promise<{ name?: string }> };
    }).bluetooth;

    if (!bt) {
      toast.error("Bluetooth API not available in this browser");
      return;
    }

    try {
      setConnecting(true);
      const device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: [0x1800] });
      setDeviceName(device?.name || "Flipper device selected");
      toast.success("Flipper Zero device connected");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection canceled";
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  };

  const downloadToolIndex = () => {
    window.open("/assets/flipper-tools/index.json", "_blank", "noopener,noreferrer");
  };

  const selectedTool = useMemo(
    () => FLIPPER_TOOLS.find((tool) => tool.id === selectedToolId) ?? FLIPPER_TOOLS[0],
    [selectedToolId]
  );

  const selectedGuide = useMemo(
    () => CATEGORY_GUIDES[selectedTool.category] ?? CATEGORY_GUIDES.system,
    [selectedTool.category]
  );

  const downloadFullGuide = () => {
    const guide = FLIPPER_TOOLS.map((tool) => ({
      tool: tool.name,
      category: tool.category,
      asset: tool.asset,
      base: FLIPPER_BASE_GUIDE,
      ...CATEGORY_GUIDES[tool.category],
    }));
    const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flipper-zero-guided-instructions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const llmWidgetOutput = useMemo(() => {
    if (!llmPrompt.trim()) return "";
    const top = FLIPPER_TOOLS.filter((tool) =>
      `${tool.name} ${tool.category} ${tool.summary}`.toLowerCase().includes(llmPrompt.toLowerCase())
    ).slice(0, 5);
    if (!top.length) return "No direct tool match found. Try keywords like NFC, Bluetooth, Wi-Fi, GPIO, or Sub-GHz.";
    return `Suggested tool plan:\n${top.map((t, i) => `${i + 1}. ${t.name} (${t.category})`).join("\n")}`;
  }, [llmPrompt]);

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return FLIPPER_TOOLS;
    return FLIPPER_TOOLS.filter((tool) => `${tool.name} ${tool.category} ${tool.summary}`.toLowerCase().includes(q));
  }, [toolQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <a href="/bots" className="p-2 rounded-md hover:bg-secondary transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </a>
        <div>
          <h1 className="font-mono text-sm font-bold tracking-wide">Flipper Zero Widget</h1>
          <p className="font-mono text-[10px] text-muted-foreground">Integrated tools + add-ons + connectivity + LLM helper</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-xl border border-border bg-gradient-to-b from-primary/10 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">DEVICE + CLOUD STATUS</div>
                <h2 className="font-display text-lg font-bold">Flipper Connectivity Panel</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={connectFlipper} disabled={connecting} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 disabled:opacity-50">
                  {connecting ? "Connecting..." : "Connect Flipper"}
                </button>
                <button onClick={downloadToolIndex} className="px-3 py-1.5 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80 inline-flex items-center gap-1">
                  <Download size={12} /> Download tools index
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <StatusCard icon={<Wifi size={14} />} label="Wi-Fi / Network" value={isOnline ? "online" : "offline"} />
              <StatusCard icon={<Bluetooth size={14} />} label="Bluetooth" value={bluetoothAvailable ? "available" : "not available"} />
              <StatusCard icon={<Shield size={14} />} label="Cloud Systems" value={isOnline ? "reachable" : "pending"} />
            </div>
            {deviceName && <div className="font-mono text-xs text-primary">Connected device: {deviceName}</div>}
            <a href="/assets/addons/flipper-zero-widget.json" download className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline">
              <Download size={11} /> Download Flipper widget integration profile
            </a>
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-4 space-y-3">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-primary">LLM SECTION</div>
              <h2 className="font-display text-lg font-bold">Flipper Task Planner Widget</h2>
              <p className="text-xs text-muted-foreground">Type goals to map relevant Flipper tools quickly.</p>
            </div>
            <textarea
              value={llmPrompt}
              onChange={(e) => setLlmPrompt(e.target.value)}
              placeholder="Example: scan BLE devices and test NFC card workflow"
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
            />
            {llmWidgetOutput && <pre className="whitespace-pre-wrap p-3 rounded-md border border-border bg-background/50 font-mono text-xs text-muted-foreground">{llmWidgetOutput}</pre>}
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">GUIDED INSTRUCTIONS</div>
                <h2 className="font-display text-lg font-bold">Flipper Zero + Tool-by-Tool Guide</h2>
                <p className="text-xs text-muted-foreground">Detailed setup, operation, verification, and safety flow for every integrated tool.</p>
              </div>
              <button onClick={downloadFullGuide} className="px-3 py-1.5 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80 inline-flex items-center gap-1">
                <Download size={12} /> Download full guide
              </button>
            </div>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
            >
              {FLIPPER_TOOLS.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
            <InstructionBlock title="Core Flipper setup" items={FLIPPER_BASE_GUIDE} />
            <InstructionBlock title={`${selectedTool.name}: setup`} items={selectedGuide.setup} />
            <InstructionBlock title={`${selectedTool.name}: operation`} items={selectedGuide.operate} />
            <InstructionBlock title={`${selectedTool.name}: verification`} items={selectedGuide.verify} />
            <InstructionBlock title={`${selectedTool.name}: safety`} items={selectedGuide.safety} />
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">ESSENTIAL TOOLSET</div>
                <h2 className="font-display text-lg font-bold">30 Popular Flipper Zero Tools (Integrated)</h2>
              </div>
              <input
                value={toolQuery}
                onChange={(e) => setToolQuery(e.target.value)}
                placeholder="Search tools..."
                className="px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredTools.map((tool) => (
                <div key={tool.id} className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                  <div className="font-mono text-xs font-bold">{tool.name}</div>
                  <div className="font-mono text-[10px] text-primary uppercase tracking-wide">{tool.category}</div>
                  <p className="font-mono text-[11px] text-muted-foreground">{tool.summary}</p>
                  <a href={tool.asset} download className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline">
                    <Download size={11} /> Download tool profile
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold">{icon}{label}</div>
      <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
    </div>
  );
}

function InstructionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
      <div className="font-mono text-xs font-bold">{title}</div>
      <ol className="list-decimal pl-4 space-y-1">
        {items.map((item) => (
          <li key={item} className="font-mono text-[11px] text-muted-foreground">{item}</li>
        ))}
      </ol>
    </div>
  );
}
