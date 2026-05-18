/**
 * API response types for ClearPath (mirrors backend Pydantic schemas).
 * Re-exports from the main types/index.ts and adds API-specific shapes.
 */
export type { Clause, ClauseType, ChatMessage, DocumentAnalysis, RedFlag, RedFlagSeverity, RiskCategory, RiskScore } from "./index";

export interface UploadResponse {
  document_id: string;
  filename: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface HealthDetailedResponse extends HealthResponse {
  version: string;
  environment: string;
  rate_limit_rpm: number;
  providers: ProviderInfo[];
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  models: string[];
  key_count: number;
  is_local: boolean;
  ollama_status?: string | null;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  provider: string;
  is_local: boolean;
}
