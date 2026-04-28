<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Tagging;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Services\Catalog\Exceptions\VerticalNotFoundException;

final readonly class VerticalDictionary
{
    /**
     * @param array<string, mixed> $fields
     */
    public function __construct(
        public string $name,
        public array $fields,
    ) {
    }

    public static function for(CatalogVertical $vertical): self
    {
        $path = config_path("recommender/verticals/{$vertical->value}.php");

        if (! is_file($path)) {
            throw new VerticalNotFoundException("Vertical config not found: {$vertical->value}");
        }

        /** @var array{name: string, fields: array<string, mixed>} $cfg */
        $cfg = require $path;

        return new self(name: $cfg['name'], fields: $cfg['fields']);
    }

    /**
     * Convert the fields dictionary to an OpenAI structured-output JSON schema.
     *
     * @return array<string, mixed>
     */
    public function toJsonSchema(): array
    {
        $properties = [];
        $required   = [];

        foreach ($this->fields as $fieldName => $fieldDef) {
            /** @var array{type: string, enum?: list<string>, description?: string, min?: int, max?: int} $fieldDef */
            $required[] = $fieldName;

            $node = [];

            if (isset($fieldDef['description'])) {
                $node['description'] = $fieldDef['description'];
            }

            if ($fieldDef['type'] === 'array') {
                $node['type'] = 'array';

                if (isset($fieldDef['min'])) {
                    $node['minItems'] = $fieldDef['min'];
                }

                if (isset($fieldDef['max'])) {
                    $node['maxItems'] = $fieldDef['max'];
                }

                $items = ['type' => 'string'];

                if (isset($fieldDef['enum'])) {
                    $items['enum'] = $fieldDef['enum'];
                }

                $node['items'] = $items;
            } else {
                // string
                $node['type'] = 'string';

                if (isset($fieldDef['enum'])) {
                    $node['enum'] = $fieldDef['enum'];
                }
            }

            $properties[$fieldName] = $node;
        }

        return [
            'name'   => 'product_tags_' . $this->name,
            'strict' => true,
            'schema' => [
                'type'                 => 'object',
                'properties'           => $properties,
                'required'             => $required,
                'additionalProperties' => false,
            ],
        ];
    }
}
