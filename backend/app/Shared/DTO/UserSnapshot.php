<?php

declare(strict_types=1);

namespace App\Shared\DTO;

use App\Shared\ValueObjects\UserId;

final readonly class UserSnapshot
{
    public function __construct(
        public UserId $id,
        public string $email,
        public ?string $name,
        public ?string $locale,
    ) {
    }
}
