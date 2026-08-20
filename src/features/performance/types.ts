/** 绩效考核类型(3层KPI, DECISIONS #40), 镜像后端 app/schemas/performance.py */

export interface PerformanceConfig {
  id: number;
  name: string;
  resultWeight: number;
  processWeight: number;
  behaviorWeight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceConfigCreateInput {
  name: string;
  result_weight: number;
  process_weight: number;
  behavior_weight: number;
  is_active?: boolean;
}

export interface PerformanceConfigUpdateInput {
  name?: string;
  result_weight?: number;
  process_weight?: number;
  behavior_weight?: number;
  is_active?: boolean;
}

export interface LayerScore {
  score: number;
  weight: number;
  weighted: number;
  detail: string;
}

export interface PerformanceScoreResponse {
  userId: number;
  userName: string;
  year: number;
  periodType: string;
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  result: LayerScore;
  process: LayerScore;
  behavior: LayerScore;
  overall: number;
  configName: string;
}
