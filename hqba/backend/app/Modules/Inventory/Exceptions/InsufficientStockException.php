<?php

namespace App\Modules\Inventory\Exceptions;

use App\Modules\Inventory\Enums\ItemType;
use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct(
        public readonly int $branchId,
        public readonly int $cropId,
        public readonly ItemType $itemType,
        public readonly float $available,
        public readonly float $requested,
    ) {
        $type = $itemType->labelEn();
        parent::__construct(
            "Insufficient stock: {$type} available={$available}, requested={$requested} " .
            "(branch_id={$branchId}, crop_id={$cropId})"
        );
    }
}
