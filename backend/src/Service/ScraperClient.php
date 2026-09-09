<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\BadGatewayHttpException;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class ScraperClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $scraperBaseUrl,
        private readonly LoggerInterface $logger,
    ) {}

    public function crawl(string $url): array
    {
        $endpoint = rtrim($this->scraperBaseUrl, '/').'/crawl';

        try {
            $response = $this->httpClient->request('POST', $endpoint, [
                'json' => ['url' => $url],
            ]);
            $statusCode = $response->getStatusCode();

            if ($statusCode >= 400) {
                $this->logger->error('Scraper service returned an error response.', [
                    'scraper_endpoint' => $endpoint,
                    'scraper_status_code' => $statusCode,
                    'scraper_response_body' => mb_substr($response->getContent(false), 0, 2_000),
                    'url_host' => parse_url($url, PHP_URL_HOST),
                ]);

                throw new BadGatewayHttpException('The scraper service could not process the crawl request.');
            }

            return $response->toArray(false);
        } catch (BadGatewayHttpException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $this->logger->error('Scraper service request failed.', [
                'scraper_endpoint' => $endpoint,
                'url_host' => parse_url($url, PHP_URL_HOST),
                'exception' => $exception,
            ]);

            throw new BadGatewayHttpException('The scraper service is unavailable.', $exception);
        }
    }
}
