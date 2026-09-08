<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final class ScraperClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $scraperBaseUrl,
    ) {}

    public function crawl(string $url): array
    {
        $response = $this->httpClient->request('POST', rtrim($this->scraperBaseUrl, '/').'/crawl', [
            'json' => ['url' => $url],
        ]);

        return $response->toArray();
    }
}
