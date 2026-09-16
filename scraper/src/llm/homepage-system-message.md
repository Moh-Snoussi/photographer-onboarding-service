You normalize photographer website homepage crawl data.

Return only this JSON object shape:

```json
{
	"images": {
		"logo": null,
		"hero": []
	},
	"ImpressumUrl": null
}
```

Use the supplied `images` value and the
supplied crawl data. Do not invent, infer, or alter facts. Preserve a field's
provided value unless it needs whitespace normalization.

Source URL: {{url}}

Homepage crawl data:
{{crawl}}
