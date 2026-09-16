# LLM Adapters

The scraper's LLM layer is optional. It receives a rendered system message and
returns JSON used to normalize homepage and legal-notice crawl data. Select one
provider with `LLM_PROVIDER`; all adapters require `LLM_MODEL`.

## OpenAI-compatible adapter

The OpenAI-compatible adapter calls `POST /chat/completions` with an OpenAI
Chat Completions request body and `response_format: { "type": "json_object" }`.
It makes the scraper portable across services that expose this API contract,
without coupling the crawler to one hosted model provider.

It is used by:

- [OpenAI](https://platform.openai.com/docs/api-reference/chat/create): set
  `LLM_PROVIDER=openai`, `OPENAI_API_KEY`, and `LLM_MODEL`. `OPENAI_BASE_URL`
  is optional and defaults to `https://api.openai.com/v1`.
- [xAI](https://docs.x.ai/docs/api-reference): set `LLM_PROVIDER=xai` (or
  `grok`), `XAI_API_KEY`, and `LLM_MODEL`. `XAI_BASE_URL` is optional and
  defaults to `https://api.x.ai/v1`.
- Other providers that explicitly document compatible Chat Completions and JSON
  object response-format support: configure their base URL and credentials in
  an adapter entry before use, then exercise the fixture and integration tests.

The adapter performs normalization only; deterministic browser extraction
remains local. The `fixture` provider is available for fast, credential-free
and repeatable automated tests.

## Aleph Alpha

[Aleph Alpha](https://www.aleph-alpha.com/) is a German AI company. This
project uses its [PhariaInference API documentation](https://docs.aleph-alpha.com/products/pharia-inference/overview/)
and calls the deployment's `/complete/json` endpoint.

Configure:

```env
LLM_PROVIDER=aleph-alpha
LLM_MODEL=your-contracted-model
ALEPH_ALPHA_BASE_URL=https://your-pharia-inference-deployment
ALEPH_ALPHA_API_KEY=...
```

Access, deployment URL, model selection, and credentials are provisioned as
part of the Aleph Alpha commercial engagement; obtain them before enabling this
adapter.

## Ollama

[Ollama](https://ollama.com/) runs models locally and is useful for development,
offline experiments, and provider-independent testing. The adapter calls its
local `/api/chat` endpoint and requests JSON output.

```env
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Local inference capacity is constrained by model size, context length,
concurrency, CPU/GPU hardware, and available RAM or VRAM. Machines with 8 GB
or 36 GB of memory may be useful for small, low-concurrency experiments, but
must be benchmarked against expected latency and throughput before any
production deployment. The local Ollama service should remain private to the
application network.

## xAI and sustainability

xAI can be selected through the OpenAI-compatible adapter as described above.
No evidence is recorded in this repository to support a claim that hosting or
using xAI "in space" has lower environmental impact. Do not make that claim in
product or operational documentation without current, independently verifiable
provider information and a defined comparison boundary.

## Request diagnostics

Every HTTP-adapter request log includes the provider, selected model, endpoint,
and fully resolved request URL. Credentials and request payloads are excluded
from standard logs. Enable `LOG_LLM_PAYLOADS=true` only where consented crawl
data can be retained safely.
