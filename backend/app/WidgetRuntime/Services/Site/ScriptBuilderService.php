<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Site;

use App\Enums\ScriptBuildStatus;
use App\Shared\Settings\GeneralSettings;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteScriptBuild;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ScriptBuilderService
{
    /**
     * Build the JS bundle for a site and upload it to Cloudflare R2.
     *
     * Flow:
     *   1. Collect all enabled widgets with their config + i18n
     *   2. Call widget-builder service → returns obfuscated JS
     *   3. Upload to R2: sites/{domain}/{token}.js (token is an unguessable 5-char random)
     *   4. Create SiteScriptBuild record
     */
    public function build(Site $site): SiteScriptBuild
    {
        $site->loadMissing(['script', 'widgets']);

        $modules = $this->collectModules($site, $this->fetchModuleDefaults());

        return $this->buildAndDeploy($site, $modules, obfuscate: true);
    }

    /**
     * Return the latest active build for the site, building one synchronously
     * if none exists yet. Guarantees the returned URL actually points to a
     * file that exists on R2.
     */
    public function ensureBuilt(Site $site): SiteScriptBuild
    {
        $site->loadMissing('script');

        if ($site->script === null) {
            throw new \RuntimeException("Site {$site->id} has no script token.");
        }

        $latest = $site->script->builds()
            ->where('status', ScriptBuildStatus::Active->value)
            ->orderByDesc('version')
            ->first();

        if ($latest !== null) {
            return $latest;
        }

        return $this->build($site);
    }

    /**
     * Build and deploy using a config from the admin configurator.
     *
     * Input format matches DB: each module has `is_enabled`, `config` (without `enabled`), `i18n`.
     * Only modules with `is_enabled: true` are included in the JS bundle.
     *
     * @param array<string, array{is_enabled: bool, config: array<string, mixed>, i18n: mixed}> $modules
     */
    public function buildFromModules(Site $site, array $modules, bool $obfuscate = true): SiteScriptBuild
    {
        $site->loadMissing(['script']);

        // Transform frontend format → widget-builder format:
        // filter by is_enabled, put enabled:true back into config
        $builderModules = [];
        foreach ($modules as $id => $module) {
            if (! ($module['is_enabled'] ?? false)) {
                continue;
            }
            $config = $module['config'] ?? [];
            $config['enabled'] = true;
            $builderModules[(string) $id] = [
                'config' => $config,
                'i18n' => $module['i18n'] ?? [],
            ];
        }

        return $this->buildAndDeploy($site, $builderModules, $obfuscate);
    }

    /**
     * Core: build JS from modules (widget-builder format), upload to R2, save SiteScriptBuild.
     *
     * @param array<string, array{config: array<string, mixed>, i18n: mixed}> $modules
     */
    private function buildAndDeploy(Site $site, array $modules, bool $obfuscate): SiteScriptBuild
    {
        $script = $site->script;

        if ($script === null) {
            throw new \RuntimeException("Site {$site->id} has no script token.");
        }

        $js = $this->buildJsFromModules($site, $modules, $obfuscate);
        $hash = md5($js);
        $slug = substr($script->token, 0, 5);
        $path = "sites/{$site->domain}/{$slug}.js";

        Storage::disk('r2')->put($path, $js, [
            'ContentType' => 'application/javascript',
            'CacheControl' => 'no-cache, no-store, must-revalidate',
        ]);

        $publicUrl = rtrim((string) config('services.r2.public_url', 'https://cdn.widgetis.com'), '/');
        $fileUrl = "{$publicUrl}/{$path}";

        $version = ($script->builds()->max('version') ?? 0) + 1;

        $script->builds()
            ->where('status', ScriptBuildStatus::Active->value)
            ->update(['status' => ScriptBuildStatus::Inactive->value]);

        $build = SiteScriptBuild::create([
            'site_script_id' => $script->id,
            'version' => $version,
            'config' => $modules,
            'file_url' => $fileUrl,
            'file_hash' => $hash,
            'status' => ScriptBuildStatus::Active->value,
            'built_at' => now(),
            'created_at' => now(),
        ]);

        Log::info('ScriptBuilderService: bundle deployed to R2.', [
            'site_id' => $site->id,
            'domain' => $site->domain,
            'version' => $version,
            'file_url' => $fileUrl,
            'widgets' => count($modules),
        ]);

        return $build;
    }

    /**
     * Call widget-builder /build with the given modules, get JS bundle.
     *
     * @param array<string, array{config: array<string, mixed>, i18n: mixed}> $modules
     */
    private function buildJsFromModules(Site $site, array $modules, bool $obfuscate = true): string
    {
        $now = now()->toRfc7231String();
        $version = now()->format('Y.m.d.His');
        $settings = app(GeneralSettings::class);
        $support = $settings->messengers['telegram'] ?? '';
        $website = rtrim((string) config('app.url'), '/');
        $year = now()->year;
        $comment = implode("\n", [
            '/**',
            ' * Widgetis — Widget Platform for E-Commerce',
            " * Site:     {$site->domain}",
            " * Version:  {$version}",
            " * Built:    {$now}",
            ' * ',
            " * Support:  {$support}",
            " * Website:  {$website}",
            ' * ',
            ' * LICENSE: Proprietary and Confidential.',
            ' * This code is the exclusive intellectual property of Widgetis.',
            ' * Unauthorized copying, decompilation, modification, distribution',
            ' * or reuse of this code, in whole or in part, is strictly prohibited.',
            " * © {$year} Widgetis. All rights reserved.",
            " * {$website}/license",
            ' * ',
            ' * Protected under Ukrainian law:',
            ' *   Закон №2811-IX «Про авторське право і суміжні права»',
            ' *   zakon.rada.gov.ua/laws/show/2811-20',
            ' *   Ст. 176 КК України — кримінальна відповідальність',
            ' *   Ст. 432 ЦК України — цивільний захист у суді',
            ' */',
        ]);

        if (empty($modules)) {
            return $comment;
        }

        $url = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        $payload = (string) json_encode([
            'modules' => $modules,
            'obfuscate' => $obfuscate,
            'allowedDomain' => $site->domain,
            'comment' => $comment,
        ], JSON_UNESCAPED_UNICODE);

        $ch = curl_init("{$url}/build");

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
        ]);

        $response = (string) curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError !== '') {
            throw new \RuntimeException("Widget builder connection error: {$curlError}");
        }

        if ($httpStatus !== 200) {
            throw new \RuntimeException("Widget builder failed (HTTP {$httpStatus}): {$response}");
        }

        return $response;
    }

    /**
     * Fetch default config + i18n from widget-builder's /modules endpoint.
     *
     * @return array<string, array{defaultConfig: array<string, mixed>|null, defaultI18n: mixed}>
     */
    private function fetchModuleDefaults(): array
    {
        $url = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        $ch = curl_init("{$url}/modules");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = (string) curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpStatus !== 200) {
            return [];
        }

        /** @var array<string, array{defaultConfig?: array<string, mixed>, defaultI18n?: mixed}> $schemas */
        $schemas = json_decode($response, true) ?? [];

        return $schemas;
    }

    /**
     * Collect enabled widgets into the format expected by widget-builder:
     * { "module-{slug}": { "config": {...}, "i18n": {...} } }
     *
     * Convention: SiteWidget.config stores either:
     *   - { "config": {...}, "i18n": {...} }   — structured format (preferred)
     *   - flat object                           — legacy, treated as config-only
     *
     * When i18n is empty, falls back to the module's defaultI18n from widget-builder.
     *
     * @param array<string, array{defaultConfig?: array<string, mixed>, defaultI18n?: mixed}> $defaults
     * @return array<string, array{config: array<string, mixed>, i18n: mixed}>
     */
    private function collectModules(Site $site, array $defaults = []): array
    {
        $modules = [];

        // Resolve product slugs by ID without crossing context boundary
        $productIds = $site->widgets->where('is_enabled', true)->pluck('product_id')->unique()->all();
        $productSlugs = DB::table('products')
            ->whereIn('id', $productIds)
            ->pluck('slug', 'id');

        foreach ($site->widgets->where('is_enabled', true) as $widget) {
            $slug = $productSlugs->get($widget->product_id);

            if ($slug === null) {
                continue;
            }

            $stored = $widget->config ?? [];
            $moduleName = "module-{$slug}";

            // Detect structured format
            if (isset($stored['config']) && is_array($stored['config'])) {
                $config = $stored['config'];
                $i18n = isset($stored['i18n']) && is_array($stored['i18n']) ? $stored['i18n'] : [];
            } else {
                // Legacy flat format: extract i18n by detecting locale-keyed objects
                $config = [];
                $i18n = [];

                foreach ($stored as $key => $value) {
                    if ($this->looksLikeI18n($value)) {
                        $i18n = $value;
                    } else {
                        $config[$key] = $value;
                    }
                }
            }

            // Skip modules that don't exist in widget-builder
            if (! empty($defaults) && ! array_key_exists($moduleName, $defaults)) {
                Log::warning("ScriptBuilderService: module {$moduleName} not found in widget-builder, skipping.");
                continue;
            }

            // Fall back to module's defaultI18n when i18n is empty
            if (empty($i18n) && isset($defaults[$moduleName]['defaultI18n'])) {
                $i18n = $defaults[$moduleName]['defaultI18n'];
            }

            $config['enabled'] = true;

            $modules[$moduleName] = [
                'config' => $config,
                'i18n' => $i18n,
            ];
        }

        return $modules;
    }

    /**
     * Detect if a value is an i18n object: array keyed by locale codes (en, uk, etc.)
     *
     * @param mixed $value
     */
    private function looksLikeI18n(mixed $value): bool
    {
        if (! is_array($value) || empty($value)) {
            return false;
        }

        $localePattern = '/^[a-z]{2}(_[A-Z]{2})?$/';

        foreach (array_keys($value) as $key) {
            if (! preg_match($localePattern, (string) $key)) {
                return false;
            }
        }

        return true;
    }
}
