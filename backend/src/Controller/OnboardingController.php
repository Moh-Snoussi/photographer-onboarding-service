<?php

namespace App\Controller;

use App\Dto\OnboardingRequest;
use App\Service\ScraperClient;
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
    ): JsonResponse {
        /** @var OnboardingRequest $payload */
        $payload = $serializer->deserialize($request->getContent(), OnboardingRequest::class, 'json');
        $errors = $validator->validate($payload);

        if (count($errors) > 0) {
            return $this->json(['error' => (string) $errors], 422);
        }

        if (!$payload->allowTextScraping && !$payload->allowImageScraping) {
            return $this->json(['error' => 'At least one scraping consent flag must be enabled.'], 422);
        }

        $crawl = $scraper->crawl($payload->url);

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
