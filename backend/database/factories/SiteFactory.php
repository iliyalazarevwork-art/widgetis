<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Core\Models\User;
use App\Enums\Platform;
use App\Enums\SiteStatus;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Site>
 */
class SiteFactory extends Factory
{
    protected $model = Site::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $domain = fake()->domainName();

        return [
            'user_id' => User::factory(),
            'site_key' => (string) Str::uuid7(),
            'name' => fake()->company(),
            'domain' => $domain,
            'url' => "https://{$domain}",
            'allowed_origins' => ["https://{$domain}"],
            'platform' => Platform::Horoshop,
            'status' => SiteStatus::Active,
            'script_installed' => false,
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => SiteStatus::Active]);
    }

    public function withOrigin(string $origin): static
    {
        return $this->state(['allowed_origins' => [$origin]]);
    }
}
