<?php

namespace App\Security;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class ApiTokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        #[Autowire('%env(ONBOARDING_API_TOKEN)%')]
        private readonly string $apiToken,
        private readonly UserProvider $userProvider,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        return str_starts_with($request->headers->get('Authorization', ''), 'Bearer ');
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $apiToken = substr((string) $request->headers->get('Authorization'), 7);

        if (!hash_equals($this->apiToken, $apiToken)) {
            throw new AuthenticationException('Invalid API token.');
        }

        return new SelfValidatingPassport(
            new UserBadge($this->userProvider->getUserIdentifier(), $this->userProvider->loadUserByIdentifier(...)),
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
    }
}
