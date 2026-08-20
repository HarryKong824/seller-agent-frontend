/** 阶段推进历史类型(DECISIONS #37), 镜像后端 app/schemas/stage_progress.py */

export interface StageProgress {
  id: number;
  customerId: number;
  fromStage: string;
  toStage: string;
  changedById: number;
  changedByFullName?: string | null;
  changedAt: string;
  note: string | null;
  snapshot: Record<string, unknown> | null;
}

export interface StageProgressListResponse {
  items: StageProgress[];
  total: number;
}

export interface StageProgressStat {
  fromStage: string;
  toStage: string;
  count: number;
  avgDwellDays: number | null;
}

export interface StageProgressStatsResponse {
  stats: StageProgressStat[];
  totalAdvances: number;
}

export interface StageProgressCreateInput {
  from_stage: string;
  to_stage: string;
  changed_by_id: number;
  note?: string | null;
  snapshot?: Record<string, unknown> | null;
}
