<?php

namespace App\Modules\Branch\Services;

use App\Modules\Branch\Models\AiCalibrationSuggestion;
use App\Modules\Branch\Models\CalibrationShot;
use App\Modules\Branch\Models\CalibrationSession;
use App\Modules\Recipes\Models\EspressoRecipe;
use App\Modules\Recipes\Models\Recipe;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiCalibrationService
{
    protected string $apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    protected string $model = 'google/gemini-3-flash-preview';

    public function analyze(int $branchId, int $cropId, int $userId, ?int $grinderId = null, ?int $machineId = null): AiCalibrationSuggestion
    {
        // Collect recent calibration data
        $shots = $this->collectCalibrationData($branchId, $cropId, $grinderId, $machineId);

        // Get target recipe
        $recipe = Recipe::where('crop_id', $cropId)
            ->where('recipe_type', 'espresso')
            ->where('status', 'published')
            ->where('is_current', true)
            ->first();

        $espresso = $recipe ? EspressoRecipe::where('recipe_id', $recipe->id)->first() : null;

        // Build prompt
        $prompt = $this->buildPrompt($espresso, $shots);

        // Call AI
        $aiResponse = $this->callOpenRouter($prompt);

        // Parse response
        $parsed = $this->parseAiResponse($aiResponse);

        // Save suggestion
        return AiCalibrationSuggestion::create([
            'branch_id' => $branchId,
            'crop_id' => $cropId,
            'equipment_grinder_id' => $grinderId,
            'equipment_machine_id' => $machineId,
            'suggested_dose' => $parsed['suggested_dose'] ?? null,
            'suggested_grind' => $parsed['suggested_grind'] ?? null,
            'suggested_time' => $parsed['suggested_time'] ?? null,
            'suggested_yield' => $parsed['suggested_yield'] ?? null,
            'confidence' => $parsed['confidence'] ?? null,
            'reasoning_ar' => $parsed['reasoning_ar'] ?? null,
            'reasoning_en' => $parsed['reasoning_en'] ?? null,
            'alerts' => $parsed['alerts'] ?? [],
            'analysis_data' => [
                'shots_count' => count($shots),
                'target_recipe' => $espresso ? [
                    'dose' => $espresso->dose, 'grind' => $espresso->grind_setting,
                    'time' => $espresso->extraction_time, 'yield' => $espresso->yield,
                    'tds' => $espresso->tds,
                ] : null,
                'ai_raw_response' => $aiResponse,
            ],
            'status' => 'pending',
            'requested_by' => $userId,
        ]);
    }

    protected function collectCalibrationData(int $branchId, int $cropId, ?int $grinderId, ?int $machineId): array
    {
        $query = CalibrationSession::where('branch_id', $branchId)
            ->where('crop_id', $cropId);

        if ($grinderId) $query->where('equipment_grinder_id', $grinderId);
        if ($machineId) $query->where('equipment_machine_id', $machineId);

        $sessionIds = $query->orderByDesc('created_at')->limit(10)->pluck('id');

        return CalibrationShot::whereIn('calibration_session_id', $sessionIds)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'dose' => (float) $s->dose,
                'grind' => $s->grind_setting,
                'time' => $s->extraction_time,
                'yield' => (float) $s->yield,
                'tds' => $s->tds ? (float) $s->tds : null,
                'ext_percent' => $s->extraction_percent ? (float) $s->extraction_percent : null,
                'in_range' => $s->is_within_range,
            ])
            ->toArray();
    }

    protected function buildPrompt(?EspressoRecipe $target, array $shots): string
    {
        $targetStr = $target
            ? "Target Recipe: dose={$target->dose}g, grind={$target->grind_setting}, time={$target->extraction_time}s, yield={$target->yield}g, TDS={$target->tds}, extraction={$target->extraction_percent}%"
            : "No target recipe available.";

        $shotsStr = collect($shots)->map(fn ($s, $i) =>
            "Shot " . ($i + 1) . ": dose={$s['dose']}g, grind={$s['grind']}, time={$s['time']}s, yield={$s['yield']}g" .
            ($s['tds'] ? ", TDS={$s['tds']}" : '') .
            ($s['in_range'] ? ' ✓' : ' ✗')
        )->implode("\n");

        return <<<PROMPT
You are an expert espresso calibration analyst for a specialty coffee roastery.

{$targetStr}

Recent calibration shots (newest first):
{$shotsStr}

Analyze the calibration data and provide recommendations. Consider:
1. Grind drift patterns (consistent over/under extraction)
2. TDS consistency
3. Time vs yield relationship
4. Whether the current grind setting needs adjustment

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{
  "suggested_dose": <number>,
  "suggested_grind": "<string>",
  "suggested_time": <number>,
  "suggested_yield": <number>,
  "confidence": <0-100>,
  "reasoning_ar": "<Arabic explanation for the barista>",
  "reasoning_en": "<English explanation>",
  "alerts": ["grinder_drift", "bean_aging", "under_extraction", "over_extraction", "channeling"]
}

Only include alerts that actually apply. Keep reasoning concise (2-3 sentences max).
PROMPT;
    }

    protected function callOpenRouter(string $prompt): ?string
    {
        $apiKey = config('services.openrouter.api_key');

        if (!$apiKey) {
            Log::warning('OpenRouter API key not configured');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->apiUrl, [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }

            Log::error('OpenRouter API error', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('OpenRouter API exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    protected function parseAiResponse(?string $response): array
    {
        if (!$response) {
            return [
                'reasoning_ar' => 'لم يتمكن النظام من الاتصال بخدمة الذكاء الاصطناعي',
                'reasoning_en' => 'Could not connect to AI service',
                'alerts' => [],
                'confidence' => 0,
            ];
        }

        // Clean markdown code blocks if present
        $cleaned = preg_replace('/```json\s*/', '', $response);
        $cleaned = preg_replace('/```\s*/', '', $cleaned);
        $cleaned = trim($cleaned);

        $parsed = json_decode($cleaned, true);

        if (!$parsed) {
            return [
                'reasoning_ar' => 'لم يتمكن النظام من تحليل استجابة الذكاء الاصطناعي',
                'reasoning_en' => 'Could not parse AI response',
                'alerts' => [],
                'confidence' => 0,
            ];
        }

        return $parsed;
    }

    public function getSuggestions(int $branchId, ?int $cropId = null)
    {
        $query = AiCalibrationSuggestion::where('branch_id', $branchId)
            ->with(['crop', 'grinder', 'machine'])
            ->orderByDesc('created_at');

        if ($cropId) $query->where('crop_id', $cropId);

        return $query->paginate(request('per_page', 10));
    }
}
