<?php

namespace App\Modules\Inventory\Enums;

enum ItemType: string
{
    case Green = 'green';
    case Roasted = 'roasted';
    case Finished250 = 'finished_250';
    case Finished500 = 'finished_500';
    case Finished1kg = 'finished_1kg';
    case Bar = 'bar';

    public function label(): string
    {
        return match ($this) {
            self::Green => 'بن أخضر',
            self::Roasted => 'بن محمص',
            self::Finished250 => 'كيس 250g',
            self::Finished500 => 'كيس 500g',
            self::Finished1kg => 'كيس 1kg',
            self::Bar => 'قهوة بار',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Green => 'Green Coffee',
            self::Roasted => 'Roasted Coffee',
            self::Finished250 => '250g Bag',
            self::Finished500 => '500g Bag',
            self::Finished1kg => '1kg Bag',
            self::Bar => 'Bar Coffee',
        };
    }

    public function defaultUnit(): string
    {
        return match ($this) {
            self::Green, self::Roasted => 'kg',
            self::Finished250, self::Finished500, self::Finished1kg => 'bags',
            self::Bar => 'g',
        };
    }

    public function isFinished(): bool
    {
        return in_array($this, [self::Finished250, self::Finished500, self::Finished1kg]);
    }
}
