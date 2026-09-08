<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class OnboardingRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Url(protocols: ['http', 'https'])]
        public readonly string $url,
        public readonly bool $allowTextScraping,
        public readonly bool $allowImageScraping,
    ) {}
}
