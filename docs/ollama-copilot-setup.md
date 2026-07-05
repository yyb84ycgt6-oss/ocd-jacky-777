# Ollama Copilot Setup

Use this when you want your own Ollama-hosted model to help with coding in this repository.

## 1) Run Ollama

Start Ollama on the machine where the model is hosted:

```sh
ollama serve
```

Pull at least one coding-capable model:

```sh
ollama pull qwen2.5-coder:14b
```

Quick check:

```sh
curl http://localhost:11434/api/tags
```

## 2) Connect a coding client

GitHub Copilot itself does not currently let you swap in Ollama as its backend model.
Use Ollama through a compatible coding client in parallel with Copilot.

Supported options include:

- Continue (VS Code / JetBrains)
- Cline (VS Code)
- OpenWebUI
- Aider

## 3) Example: Continue configuration

Create your Continue config file (or update your existing one):

- Linux/macOS: `~/.continue/config.json`
- Windows: `%USERPROFILE%\.continue\config.json`

```json
{
  "models": [
    {
      "title": "Local Ollama Coder",
      "provider": "ollama",
      "model": "qwen2.5-coder:14b",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Local Ollama Coder",
    "provider": "ollama",
    "model": "qwen2.5-coder:14b",
    "apiBase": "http://localhost:11434"
  }
}
```

If Ollama is remote, replace `localhost` with your host/IP and secure it first (VPN or authenticated reverse proxy with TLS).

## 4) Suggested hybrid workflow

- If you have GitHub Copilot, you can keep it enabled for inline autocomplete.
- Use Ollama client chats/agents for larger work (refactors, debugging, architecture tasks).
- Use repository scripts for verification:
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## 5) Remote security baseline

If your Ollama server is not local:

- Do not expose raw port `11434` publicly.
- Put Ollama behind VPN or a reverse proxy with auth and TLS.
- Restrict access by IP/network.
- Monitor logs and rotate access credentials regularly.

## 6) Use with your own cloud or hardware router

If you host Ollama outside your laptop (cloud VM, home server, or behind your own router):

- Run Ollama only on a private interface when possible.
- Prefer VPN access (WireGuard/Tailscale) instead of open internet exposure.
- If using router port-forwarding, forward only from trusted source IPs.
- Put Nginx/Caddy in front with HTTPS + auth, then route to Ollama privately.
- Keep `apiBase` set to your secured endpoint in your client config.

## 7) Similar non-Microsoft model families (GitHub)

If you want alternatives similar to your listed Llama/CodeLlama stack, these are strong free/open options with active GitHub projects:

### Chat / coding assistants

- Qwen2.5-Coder (Alibaba Qwen)
  GitHub: https://github.com/QwenLM/Qwen2.5-Coder
- DeepSeek-Coder V2 (DeepSeek)
  GitHub: https://github.com/deepseek-ai/DeepSeek-Coder-V2
- StarCoder2 (BigCode)
  GitHub: https://github.com/bigcode-project/starcoder2
- Mistral / Mixtral family (Mistral AI)
  GitHub: https://github.com/mistralai
- Gemma / CodeGemma (Google)
  GitHub: https://github.com/google-deepmind/gemma

### Vision-capable multimodal options

- Qwen2.5-VL (Alibaba Qwen)
  GitHub: https://github.com/QwenLM/Qwen2.5-VL
- Janus-Pro (DeepSeek)
  GitHub: https://github.com/deepseek-ai/Janus
- Moondream2 (small VLM)
  GitHub: https://github.com/vikhyat/moondream

### Guard / safety style alternatives

- ShieldGemma (Google)
  GitHub: https://github.com/google-deepmind/shieldgemma
- Open-source LLM Guard tooling
  GitHub: https://github.com/protectai/llm-guard

### Vision backbones (similar category to SAM / DINO / DeiT)

- Segment Anything (SAM)
  GitHub: https://github.com/facebookresearch/segment-anything
- DINOv2
  GitHub: https://github.com/facebookresearch/dinov2
- DeiT
  GitHub: https://github.com/facebookresearch/deit

### Quick start picks for local coding with Ollama

- Qwen2.5-Coder family (quality/speed balance)
- DeepSeek-Coder V2 family (strong coding reasoning)
- StarCoder2 family (good open-source code completion baseline)
