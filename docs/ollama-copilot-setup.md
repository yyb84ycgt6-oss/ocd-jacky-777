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

If Ollama is remote, replace `localhost` with your host/IP and secure it first (set up VPN access, or an authenticated reverse proxy with TLS, before connecting your coding client).

## 4) Suggested hybrid workflow

- If you have GitHub Copilot, you can keep it enabled for inline autocomplete.
- Use Ollama client chats/agents for larger work (refactors, debugging, architecture tasks).
- This repository includes these verification scripts:
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

- [Qwen2.5-Coder](https://github.com/QwenLM/Qwen2.5-Coder) (Alibaba Qwen)
- [DeepSeek-Coder V2](https://github.com/deepseek-ai/DeepSeek-Coder-V2) (DeepSeek)
- [StarCoder2](https://github.com/bigcode-project/starcoder2) (BigCode)
- [Mistral / Mixtral family](https://github.com/mistralai) (Mistral AI)
- [Gemma / CodeGemma](https://github.com/google-deepmind/gemma) (Google)

### Vision-capable multimodal options

- [Qwen2.5-VL](https://github.com/QwenLM/Qwen2.5-VL) (Alibaba Qwen)
- [Janus-Pro](https://github.com/deepseek-ai/Janus) (DeepSeek)
- [Moondream2](https://github.com/vikhyat/moondream) (small VLM)

### Guard / safety style alternatives

- [ShieldGemma](https://github.com/google-deepmind/shieldgemma) (Google)
- [LLM Guard tooling](https://github.com/protectai/llm-guard) (Protect AI)

### Optional vision backbones (if you also need vision tasks)

- [Segment Anything (SAM)](https://github.com/facebookresearch/segment-anything)
- [DINOv2](https://github.com/facebookresearch/dinov2)
- [DeiT](https://github.com/facebookresearch/deit)

### Quick start picks for local coding with Ollama

- Qwen2.5-Coder family (quality/speed balance)
- DeepSeek-Coder V2 family (strong coding reasoning)
- StarCoder2 family (good open-source code completion baseline)
