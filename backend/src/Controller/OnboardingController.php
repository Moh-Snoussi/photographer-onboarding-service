<?php

namespace App\Controller;

use App\Dto\OnboardingRequest;
use App\Service\ScraperClient;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class OnboardingController extends AbstractController
{
    #[Route('/api/onboarding/scrape', methods: ['POST'])]
    public function __invoke(
        Request $request,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        ScraperClient $scraper,
        LoggerInterface $logger,
    ): JsonResponse {
        /** @var OnboardingRequest $payload */
        try {
            $payload = $serializer->deserialize($request->getContent(), OnboardingRequest::class, 'json');
        } catch (\Throwable $exception) {
            $logger->warning('Onboarding scrape request could not be deserialized.', ['exception' => $exception]);

            throw $exception;
        }

        $errors = $validator->validate($payload);

        if (count($errors) > 0) {
            $logger->warning('Onboarding scrape request failed validation.', [
                'violation_count' => count($errors),
            ]);

            return $this->json(['error' => (string) $errors], 422);
        }

        if (!$payload->allowTextScraping && !$payload->allowImageScraping) {
            $logger->warning('Onboarding scrape request rejected because no scraping consent was granted.', [
                'url_host' => parse_url($payload->url, PHP_URL_HOST),
            ]);

            return $this->json(['error' => 'At least one scraping consent flag must be enabled.'], 422);
        }

        $context = [
            'url_host' => parse_url($payload->url, PHP_URL_HOST),
            'allow_text_scraping' => $payload->allowTextScraping,
            'allow_image_scraping' => $payload->allowImageScraping,
        ];

        $logger->info('Onboarding scrape requested.', $context);

        try {
            $crawl = $scraper->crawl($payload->url);
        } catch (\Throwable $exception) {
            $logger->error('Onboarding scrape failed.', $context + ['exception' => $exception]);

            throw $exception;
        }

        $logger->info('Onboarding scrape completed.', $context + [
            'crawl_response_keys' => array_keys($crawl),
        ]);

        return $this->json([
            'source_url' => $payload->url,
            'consent' => [
                'text' => $payload->allowTextScraping,
                'images' => $payload->allowImageScraping,
            ],
            'crawl' => $crawl,
        ]);
    }
}
