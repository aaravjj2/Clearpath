export type ClauseType =
  | "payment"
  | "termination"
  | "liability"
  | "privacy"
  | "non_compete"
  | "intellectual_property"
  | "dispute_resolution"
  | "general"
  | "renewal";

export type RedFlagSeverity = 0 | 1 | 2 | 3;
// 0 = none, 1 = minor, 2 = moderate, 3 = serious

export interface RedFlag {
  title: string;
  explanation: string;
  why_it_matters: string;
  what_to_ask: string;
  severity: RedFlagSeverity;
}

export interface Clause {
  id: string;
  index: number;
  original_text: string;
  simplified_text: string;
  clause_type: ClauseType;
  key_terms: string[];
  red_flag: RedFlag | null;
}

export interface RiskCategory {
  label: string;
  score: number;
  summary: string;
}

export interface RiskScore {
  overall: number;
  categories: RiskCategory[];
}

export interface DocumentAnalysis {
  document_id: string;
  filename: string;
  total_clauses: number;
  clauses: Clause[];
  risk_score: RiskScore;
  red_flags: Clause[];
  status: "processing" | "complete" | "error";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cited_clause_id?: string;
}
