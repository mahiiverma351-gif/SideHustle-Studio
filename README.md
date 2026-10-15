# SideHustle Studio — AI Listing Writer

A small-business product listing writer built with **HTML, CSS and JavaScript**. It is designed for independent sellers who need clearer product titles, descriptions and search tags without paying for a hosted AI API.

## Why open innovation matters

- **Privacy:** when connected to Ollama, product details are sent to a model running on the seller's own computer, not to a hosted AI provider.
- **Choice:** swap the model by changing the model name in settings. The sample uses `qwen2.5:3b`, an open-weight model available through Ollama.
- **Cost control:** local inference avoids per-request API charges, though it uses the computer's own memory, power and processing.
- **Less lock-in:** the app uses Ollama's local HTTP API and ordinary web technologies rather than a proprietary AI SDK.
- **Accessible demo:** without Ollama, a template-based demo mode lets you test the interface. Demo mode is not AI inference.

## Features

- Product name, category, selling platform, details, brand voice and language inputs
- Listing title, description and 8–12 search tags
- Copy individual fields or all content
- Local model setup dialog and connection test
- Responsive layout for desktop and mobile
- Fallback demo mode if local AI is unavailable

## Run the project

1. Unzip the project.
2. Open `index.html` in a browser to try the demo mode.
3. For real local AI, install Ollama from <https://ollama.com>.
4. In a terminal, download and start the sample model:

   ```bash
   ollama run qwen2.5:3b
   ```

5. Keep Ollama running. If your browser blocks requests from this local page, enable Ollama browser access and restart the server.

   macOS/Linux:
   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```

   Windows PowerShell:
   ```powershell
   $env:OLLAMA_ORIGINS="*"; ollama serve
   ```

   Use the appropriate command for your shell. Only enable cross-origin access in a trusted local environment.

6. In the app, click **Connect local AI**, use URL `http://localhost:11434` and model `qwen2.5:3b`, then click **Test connection**.
7. Fill out the form and generate a listing.

If the model is not installed, run `ollama pull qwen2.5:3b`. For a smaller/faster model, install another compatible Ollama model and enter its exact name in settings.

## Important notes

- The first generation can be slower while the model loads.
- Local inference performance depends on the computer and model size.
- The app does not store a database or upload generated drafts.
- Verify every product claim, tag, price and platform policy before publishing.
- This is a prototype, not a production SaaS. A production version would need tests, accessibility review, secure deployment guidance, and user feedback.

## Side-hustle validation plan

1. Ask one Etsy, Instagram, WhatsApp or local-market seller to try it on three products.
2. Time how long writing listings takes before and after.
3. Ask whether the titles and descriptions are usable without major edits.
4. Ask what they would pay for a batch of 20 listings.
5. Improve the tool based on the seller's feedback before charging.

**Possible offer:** a low-cost listing polish service for local makers and resellers. Start by helping one seller; don't claim to have paying customers until you do.
