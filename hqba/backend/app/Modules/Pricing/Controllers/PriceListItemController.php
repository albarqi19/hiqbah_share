<?php

namespace App\Modules\Pricing\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Pricing\Models\PriceList;
use App\Modules\Pricing\Models\PriceListItem;
use App\Modules\Pricing\Requests\BulkSetPriceListItemsRequest;
use App\Modules\Pricing\Requests\SetPriceListItemRequest;
use App\Modules\Pricing\Resources\PriceListItemResource;
use App\Modules\Pricing\Services\PricingService;
use Illuminate\Http\JsonResponse;

class PriceListItemController extends ApiController
{
    public function __construct(private PricingService $service) {}

    public function index(PriceList $priceList): JsonResponse
    {
        $items = $this->service->listItems($priceList);

        return $this->success(PriceListItemResource::collection($items));
    }

    public function store(SetPriceListItemRequest $request, PriceList $priceList): JsonResponse
    {
        $item = $this->service->setItemPrice($priceList, [
            ...$request->validated(),
            'changed_by' => auth()->id(),
        ]);

        return $this->created(new PriceListItemResource($item));
    }

    public function update(SetPriceListItemRequest $request, PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $item = $this->service->updateItemPrice($item, $request->validated());

        return $this->success(new PriceListItemResource($item));
    }

    public function destroy(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->service->removeItemPrice($item);

        return $this->noContent('تم حذف السعر');
    }

    public function bulkStore(BulkSetPriceListItemsRequest $request, PriceList $priceList): JsonResponse
    {
        $items = $this->service->bulkSetPrices(
            $priceList,
            $request->validated('items'),
            auth()->id()
        );

        return $this->created(PriceListItemResource::collection($items));
    }
}
