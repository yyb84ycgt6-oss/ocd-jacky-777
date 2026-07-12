import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SAMPLE_RATE = 44100;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashPrompt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function toWavBuffer(samples: Float32Array, sampleRate = SAMPLE_RATE) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i], -1, 1);
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function generateTrack(prompt: string, durationSec: number) {
  const seed = hashPrompt(prompt || "default");
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);
  const base = 110 + (seed % 220);
  const mod = 0.4 + ((seed >> 3) % 30) / 100;
  const pulse = 2 + ((seed >> 8) % 5);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, t * 0.8) * Math.min(1, (durationSec - t) * 0.8);
    const carrier = Math.sin(2 * Math.PI * base * t);
    const harmonic = 0.45 * Math.sin(2 * Math.PI * (base * 1.5) * t + mod * Math.sin(2 * Math.PI * pulse * t));
    const shimmer = 0.2 * Math.sin(2 * Math.PI * (base * 2.03) * t);
    out[i] = (carrier + harmonic + shimmer) * 0.3 * envelope;
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
    const duration = clamp(Number(body.duration) || 20, 3, 45);

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const samples = generateTrack(prompt, duration);
    const wav = toWavBuffer(samples, SAMPLE_RATE);

    return new Response(wav, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/wav",
        "Content-Disposition": "inline; filename=track.wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("music-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
