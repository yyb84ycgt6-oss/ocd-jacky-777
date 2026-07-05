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

Create `/home/<your-user>/.continue/config.json` (or update your existing config):

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

- Keep GitHub Copilot enabled for inline autocomplete.
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
