<?php

declare(strict_types=1);

namespace Tests\Feature\Widget;

use App\Enums\ReviewStatus;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WidgetReviewControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createSiteWithDomain(string $domain = 'example.com'): Site
    {
        return Site::factory()->create(['domain' => $domain]);
    }

    private function originHeader(string $domain): string
    {
        return "https://{$domain}";
    }

    // -------------------------------------------------------------------------
    // store()
    // -------------------------------------------------------------------------

    public function test_returns_403_when_origin_not_registered(): void
    {
        $response = $this->postJson(
            '/api/v1/widget/reviews',
            [
                'visitor_name'        => 'Alice',
                'text'                => 'Great product!',
                'external_product_id' => '42',
                'photos'              => [UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg')],
            ],
            ['Origin' => 'https://unknown-store.com'],
        );

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    public function test_stores_review_with_photos_and_returns_201(): void
    {
        $site = $this->createSiteWithDomain('mystore.com');

        // Use create() instead of image() to avoid requiring the GD extension.
        $photo1 = UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg');
        $photo2 = UploadedFile::fake()->create('back.png', 80, 'image/png');

        $response = $this->postJson(
            '/api/v1/widget/reviews',
            [
                'visitor_name'        => 'Alice',
                'visitor_email'       => 'alice@example.com',
                'text'                => 'Excellent quality!',
                'rating'              => 5,
                'external_product_id' => '123',
                'photos'              => [$photo1, $photo2],
            ],
            ['Origin' => $this->originHeader('mystore.com')],
        );

        $response->assertStatus(201);
        $response->assertJsonStructure(['data' => ['id', 'media']]);

        $this->assertDatabaseHas('wgt_reviews', [
            'site_id'             => $site->id,
            'external_product_id' => '123',
            'visitor_name'        => 'Alice',
            'visitor_email'       => 'alice@example.com',
            'body'                => 'Excellent quality!',
            'rating'              => 5,
        ]);

        // Two media items should be recorded.
        $media = $response->json('data.media');
        $this->assertCount(2, $media);
        $this->assertSame('photo', $media[0]['type']);
        $this->assertSame('photo', $media[1]['type']);
    }

    public function test_returns_422_when_both_photos_and_video_are_sent(): void
    {
        $site = $this->createSiteWithDomain('shop.ua');

        $response = $this->postJson(
            '/api/v1/widget/reviews',
            [
                'visitor_name'        => 'Bob',
                'text'                => 'Nice',
                'external_product_id' => '99',
                'photos'              => [UploadedFile::fake()->create('a.jpg', 100, 'image/jpeg')],
                'video'               => UploadedFile::fake()->create('clip.mp4', 1024, 'video/mp4'),
            ],
            ['Origin' => $this->originHeader('shop.ua')],
        );

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_returns_422_when_required_fields_missing(): void
    {
        $this->createSiteWithDomain('shop.ua');

        $response = $this->postJson(
            '/api/v1/widget/reviews',
            // Missing text, external_product_id, and any media
            ['visitor_name' => 'Bob'],
            ['Origin' => $this->originHeader('shop.ua')],
        );

        $response->assertStatus(422);
    }

    // -------------------------------------------------------------------------
    // index()
    // -------------------------------------------------------------------------

    public function test_index_returns_only_reviews_with_media(): void
    {
        $site = $this->createSiteWithDomain('store.com');

        // Review with media — should be returned.
        $withMedia = Review::create([
            'site_id'             => $site->id,
            'external_product_id' => 'prod-1',
            'visitor_name'        => 'Carol',
            'body'                => 'Love it!',
            'rating'              => 4,
            'status'              => ReviewStatus::Approved,
            'media'               => [['type' => 'photo', 'url' => 'https://r2.example.com/a.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024]],
            'user_id'             => null,
        ]);

        // Review without media — must NOT be returned.
        Review::create([
            'site_id'             => $site->id,
            'external_product_id' => 'prod-1',
            'visitor_name'        => 'Dave',
            'body'                => 'No media here.',
            'rating'              => 3,
            'status'              => ReviewStatus::Approved,
            'media'               => [],
            'user_id'             => null,
        ]);

        $response = $this->getJson(
            '/api/v1/widget/reviews?external_product_id=prod-1',
            ['Origin' => $this->originHeader('store.com')],
        );

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $withMedia->id);
        $response->assertJsonStructure(['data' => [['id', 'visitor_name', 'body', 'rating', 'media', 'created_at']], 'meta']);
    }

    public function test_index_returns_403_for_unknown_origin(): void
    {
        $response = $this->getJson(
            '/api/v1/widget/reviews?external_product_id=prod-1',
            ['Origin' => 'https://not-registered.com'],
        );

        $response->assertStatus(403);
    }

    public function test_index_returns_422_when_external_product_id_missing(): void
    {
        $this->createSiteWithDomain('store.com');

        $response = $this->getJson(
            '/api/v1/widget/reviews',
            ['Origin' => $this->originHeader('store.com')],
        );

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }
}
