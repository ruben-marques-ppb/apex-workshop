export type AnalyzeItem = {
  food: string;
  matchedUsda: string | null;
  grams: number;
  kcal: number | null;
  confidence: number;
};

export type AnalyzeResponse = {
  items: AnalyzeItem[];
  totalKcal: number;
  warnings: string[];
};

export type ErrorCode =
  | 'ollama_unreachable'
  | 'vlm_bad_json'
  | 'no_food_detected'
  | 'image_too_large'
  | 'internal_error';

export type ErrorResponse = { error: ErrorCode; message?: string };

export type VlmItem = {
  food: string;
  estimated_grams: number;
  confidence: number;
};

export type UsdaFood = {
  description: string;
  kcalPer100g: number;
};
