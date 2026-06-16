// lib/geo/types.ts
// Shared types for the GEO audit pipeline.

export type EngineKey = string;

export interface ProjectContext {
  id: string;
  orgId: string;
  businessName: string;
  domain: string | null;
  industry: string | null;
  language: string; // ISO 639-1: 'ar', 'en', ...
  country: string; // ISO 3166-1: 'SA', 'AE', ...
}

export interface EngineResponse {
  text: string;
  citations: string[];
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface BrandHit {
  name: string;
  isTarget: boolean;
  firstPosition: number | null;
}

export interface AnalysisResult {
  mentioned: boolean;
  cited: boolean;
  position: number | null;
  competitors: string[];
  brands: BrandHit[];
}
