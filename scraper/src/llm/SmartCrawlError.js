export class SmartCrawlError extends Error {
	constructor(message, { cause, details } = {}) {
		super(message, { cause });
		this.details = details;
	}
}
