# Step 17 — OpenAPI Specification

## Goal
Complete OpenAPI 3.1 specification documenting all API endpoints.
Spec file serves as the single source of truth for the API contract.

## Prerequisites
Steps 01–16 completed. All endpoints are implemented.

## Actions

### 1. Create OpenAPI spec file

Create `docs/openapi.yaml` with the full specification.

The spec should document every endpoint from steps 03–14.
Structure the file as follows:

```yaml
openapi: "3.1.0"
info:
  title: Widgetis API
  version: "1.0.0"
  description: Backend API for Widgetis — widget marketplace for e-commerce stores.

servers:
  - url: /api/v1
    description: API v1

tags:
  - name: Auth
    description: Authentication (OTP, JWT, OAuth)
  - name: Products
    description: Widget catalog
  - name: Plans
    description: Subscription plans
  - name: Public
    description: Public content (cases, FAQ, settings)
  - name: Profile
    description: User dashboard and account management
  - name: Profile > Subscription
    description: Subscription management
  - name: Profile > Sites
    description: Site and widget management
  - name: Profile > Notifications
    description: In-app notifications
  - name: Admin
    description: Admin panel API
  - name: Admin > Orders
    description: Order management
  - name: Admin > Users
    description: User management
  - name: Admin > Sites
    description: Site management
  - name: Admin > Finance
    description: Financial data
  - name: Webhooks
    description: Payment provider callbacks

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

    PaginationMeta:
      type: object
      properties:
        current_page:
          type: integer
        last_page:
          type: integer
        per_page:
          type: integer
        total:
          type: integer

    User:
      type: object
      properties:
        id: { type: integer }
        name: { type: string, nullable: true }
        email: { type: string, format: email }
        phone: { type: string, nullable: true }
        telegram: { type: string, nullable: true }
        company: { type: string, nullable: true }
        avatar_url: { type: string, nullable: true }
        locale: { type: string, enum: [uk, en] }
        two_factor_enabled: { type: boolean }
        notification_enabled: { type: boolean }
        created_at: { type: string, format: date-time }

    Plan:
      type: object
      properties:
        id: { type: integer }
        slug: { type: string }
        name: { type: string }
        description: { type: string, nullable: true }
        price_monthly: { type: number }
        price_yearly: { type: number }
        max_sites: { type: integer }
        max_widgets: { type: integer }
        features: { type: array, items: { type: object } }
        is_recommended: { type: boolean }

    Product:
      type: object
      properties:
        id: { type: integer }
        slug: { type: string }
        name: { type: string }
        description: { type: string }
        icon: { type: string }
        tag: { $ref: "#/components/schemas/WidgetTag" }
        platform: { type: string }
        is_popular: { type: boolean }
        is_new: { type: boolean }

    WidgetTag:
      type: object
      properties:
        slug: { type: string }
        name: { type: string }
        color: { type: string }

    Subscription:
      type: object
      properties:
        id: { type: integer }
        plan: { $ref: "#/components/schemas/Plan" }
        billing_period: { type: string, enum: [monthly, yearly] }
        status: { type: string, enum: [active, trial, past_due, cancelled, expired] }
        is_trial: { type: boolean }
        trial_ends_at: { type: string, format: date-time, nullable: true }
        current_period_start: { type: string, format: date-time }
        current_period_end: { type: string, format: date-time }
        days_remaining: { type: integer }

    Site:
      type: object
      properties:
        id: { type: integer }
        name: { type: string, nullable: true }
        domain: { type: string }
        url: { type: string }
        platform: { type: string }
        status: { type: string, enum: [pending, active, deactivated] }
        script_installed: { type: boolean }
        widgets_count: { type: integer }
        connected_at: { type: string, format: date-time, nullable: true }

    Notification:
      type: object
      properties:
        id: { type: integer }
        type: { type: string }
        title: { type: string }
        body: { type: string }
        is_read: { type: boolean }
        created_at: { type: string, format: date-time }

# ... define all paths below ...

paths:
  # Document every endpoint here.
  # Follow this pattern for each:
  #
  # /auth/otp:
  #   post:
  #     tags: [Auth]
  #     summary: Send OTP code
  #     requestBody: ...
  #     responses: ...
  #
  # Group by tag. Include request/response schemas, status codes, and examples.
```

### 2. Document all endpoints

For each endpoint from the routes file, add a path entry.
Cover these groups (total ~80 endpoints):

**Auth (6):** otp, otp/verify, otp/resend, register, register/verify, register/complete, google, refresh, logout, user

**Public (8):** products, products/{slug}, tags, plans, plans/features, settings, cases, faq, consultations, manager-requests, demo-sessions/{code}

**Profile (20+):** dashboard, profile CRUD, subscription CRUD, sites CRUD, site widgets, my widgets, payments, notifications, settings, support, onboarding

**Admin (25+):** dashboard, orders CRUD, users CRUD, sites CRUD, subscriptions, finance, configurator, cases CRUD, demo sessions, consultations, manager requests

### 3. Add route for serving the spec

Add to `routes/api.php`:

```php
Route::get('v1/docs/openapi', function () {
    $path = base_path('docs/openapi.yaml');
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path, ['Content-Type' => 'application/yaml']);
});
```

### 4. Optional: Add Swagger UI

For browseable documentation, consider adding a Swagger UI static page.
Create `public/docs/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widgetis API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/api/v1/docs/openapi',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'BaseLayout',
        });
    </script>
</body>
</html>
```

## How to Verify

```bash
# 1. Spec file exists and is valid YAML
docker compose -f docker-compose.dev.yml exec backend php -r "echo yaml_parse_file('docs/openapi.yaml') ? 'Valid YAML' : 'Invalid';" 2>/dev/null || echo "Check manually"

# 2. Spec is served via API
curl http://localhost:9002/api/v1/docs/openapi
# Should return YAML content

# 3. Optional: Open Swagger UI in browser
# http://localhost:9002/docs/index.html

# 4. Validate spec with an online tool
# Copy the YAML to https://editor.swagger.io/ and verify no errors
```

## Commit

```
docs: add OpenAPI 3.1 specification for all API endpoints
```

---

## Final Notes

After completing all 17 steps, you should have:

- **Laravel 12** project with Docker (PostgreSQL + Redis)
- **JWT authentication** with OTP login, Google OAuth
- **Role-based access** (admin/customer) via Spatie Permission
- **Full REST API** (~80 endpoints) with consistent JSON responses
- **Subscription system** with trial, proration, cancel, grace period
- **Site management** with script generation and widget configuration
- **Notifications** (in-app) with unread count
- **Filament 5** admin panel with 12 resources
- **5 cron jobs** for automated lifecycle management
- **OpenAPI specification** documenting the complete API
- **Multi-language** support (uk/en) on all translatable content
- **Structured logging** with separate auth and payment channels

Run a final `migrate:fresh --seed` and verify all endpoints work end-to-end.
