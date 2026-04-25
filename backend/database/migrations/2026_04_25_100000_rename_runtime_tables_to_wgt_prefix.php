<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::rename('sites', 'wgt_sites');
        Schema::rename('site_widgets', 'wgt_site_widgets');
        Schema::rename('site_scripts', 'wgt_site_scripts');
        Schema::rename('site_script_builds', 'wgt_site_script_builds');
        Schema::rename('user_widget_grants', 'wgt_user_widget_grants');
        Schema::rename('otp_provider_configs', 'wgt_otp_provider_configs');
        Schema::rename('otp_requests', 'wgt_otp_requests');
        Schema::rename('demo_sessions', 'wgt_demo_sessions');
        Schema::rename('reviews', 'wgt_reviews');
    }

    public function down(): void
    {
        Schema::rename('wgt_reviews', 'reviews');
        Schema::rename('wgt_demo_sessions', 'demo_sessions');
        Schema::rename('wgt_otp_requests', 'otp_requests');
        Schema::rename('wgt_otp_provider_configs', 'otp_provider_configs');
        Schema::rename('wgt_user_widget_grants', 'user_widget_grants');
        Schema::rename('wgt_site_script_builds', 'site_script_builds');
        Schema::rename('wgt_site_scripts', 'site_scripts');
        Schema::rename('wgt_site_widgets', 'site_widgets');
        Schema::rename('wgt_sites', 'sites');
    }
};
