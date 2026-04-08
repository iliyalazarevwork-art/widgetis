<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'name', 'phone', 'email', 'preferred_at', 'status', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['preferred_at' => 'datetime'];
    }
}
