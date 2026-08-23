<?php

namespace App\Modules\Reporting\Controllers;

use App\Core\Controllers\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Activity::with('causer')->latest();

        if ($request->has('causer_id')) {
            $query->where('causer_id', $request->input('causer_id'));
        }
        if ($request->has('subject_type')) {
            $query->where('subject_type', 'like', "%{$request->input('subject_type')}%");
        }
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->input('from'));
        }
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->input('to'));
        }

        $activities = $query->paginate($request->input('per_page', 25));

        $activities->getCollection()->transform(fn ($a) => [
            'id' => $a->id,
            'description' => $a->description,
            'subject_type' => class_basename($a->subject_type ?? ''),
            'subject_id' => $a->subject_id,
            'causer' => $a->causer ? ['id' => $a->causer->id, 'name' => $a->causer->name, 'name_ar' => $a->causer->name_ar] : null,
            'event' => $a->event,
            'properties' => $a->properties,
            'created_at' => $a->created_at->toISOString(),
        ]);

        return $this->success($activities);
    }
}
