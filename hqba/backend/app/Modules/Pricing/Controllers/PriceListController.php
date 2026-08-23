<?php

namespace App\Modules\Pricing\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Pricing\Models\PriceList;
use App\Modules\Pricing\Requests\CreatePriceListRequest;
use App\Modules\Pricing\Requests\UpdatePriceListRequest;
use App\Modules\Pricing\Resources\PriceListResource;
use App\Modules\Pricing\Services\PricingService;
use Illuminate\Http\JsonResponse;

class PriceListController extends ApiController
{
    public function __construct(private PricingService $service) {}

    public function index(): JsonResponse
    {
        $priceLists = $this->service->list();

        return $this->success(PriceListResource::collection($priceLists));
    }

    public function store(CreatePriceListRequest $request): JsonResponse
    {
        $priceList = $this->service->create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return $this->created(new PriceListResource($priceList));
    }

    public function show(PriceList $priceList): JsonResponse
    {
        $priceList->load(['createdBy', 'approvedBy']);
        $priceList->loadCount('items');

        return $this->success(new PriceListResource($priceList));
    }

    public function update(UpdatePriceListRequest $request, PriceList $priceList): JsonResponse
    {
        $priceList = $this->service->update($priceList, $request->validated());

        return $this->success(new PriceListResource($priceList));
    }

    public function approve(PriceList $priceList): JsonResponse
    {
        $priceList = $this->service->approve($priceList, auth()->id());

        return $this->success(new PriceListResource($priceList), 'تم اعتماد قائمة الأسعار');
    }

    public function archive(PriceList $priceList): JsonResponse
    {
        $priceList = $this->service->archive($priceList);

        return $this->success(new PriceListResource($priceList), 'تم أرشفة قائمة الأسعار');
    }
}
