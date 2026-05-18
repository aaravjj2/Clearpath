# ClearPath Product Update & Showcase

This directory contains the screenshots, video, and documentation for the latest ClearPath update which includes offline model support, BYOK (Bring Your Own Key), and an OpenAI-compatible Completions API.

## Artifacts

1. **clearpath_homepage.jpg** - Shows the new UI with the Settings gear icon.
2. **clearpath_byok_settings.jpg** - Shows the BYOK provider settings modal with Cloud (Anthropic, OpenAI, Gemini, OpenRouter) and Local (Ollama) providers.
3. **clearpath_analysis.jpg** - Shows the main document analysis view with Red Flags and AI Chat.
4. **clearpath_demo.mp4** - A short video compiling the UI screens into a demo.

## Features Added

### 1. Multi-Provider BYOK (Bring Your Own Key)
Users can now configure their own API keys for various LLM providers:
- **Anthropic** (`claude-sonnet-4-20250514`, `claude-opus-4-20250514`)
- **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
- **Google Gemini** (`gemini-2.5-flash`, `gemini-2.5-pro`)
- **OpenRouter** (Aggregator for multiple models)

Keys are securely used for all background analysis and chat features. The backend supports automatic round-robin rotation if multiple keys are provided, and automatic fallback if a provider fails or goes down.

### 2. Offline Mode (Local LLM via Ollama)
ClearPath now fully supports offline analysis using local LLMs.
If you have Ollama running locally (e.g., `ollama run llama3.2`), ClearPath automatically detects it and can route document analysis and chat completions to your local machine, ensuring 100% data privacy for sensitive legal documents.

### 3. Copilot CLI & Chat Completions API
We've exposed a new endpoint: `POST /v1/chat/completions` that is 100% compatible with the OpenAI API format.
This allows you to use ClearPath as an AI backend for CLI tools (like GitHub Copilot CLI), Cursor, or any script expecting an OpenAI interface. It acts as an intelligent proxy, routing requests through your configured BYOK or local offline models.

## Usage

**Adding BYOK via UI:**
1. Click the gear icon on the bottom right of the page.
2. Select your provider and enter your API key.
3. The provider will light up green ("Valid").

**Using Completions API:**
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "provider": "anthropic",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```
