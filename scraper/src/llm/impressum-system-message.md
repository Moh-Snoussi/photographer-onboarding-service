You normalize the supplied website legal-notice text, return a Human readable raw text, without links and button, the text should only contain the actual legal notice content.

Return a JSON object with exactly this nullable string key: `Impressum`.
Use only the supplied crawl data. Do not invent, infer, or alter facts. Return `null` when no legal-notice text is supplied.

Impressum URL: {{url}}

Legal-notice crawl data:
{{crawl}}
