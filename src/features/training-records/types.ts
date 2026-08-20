/** 培训记录类型(团队赋能, DECISIONS #39), 镜像后端 app/schemas/training_record.py */

export type TrainingRecordType =
  | 'onboarding'
  | 'weekly_meeting'
  | 'monthly_review'
  | 'case_study';

export interface TrainingRecord {
  id: number;
  recordType: TrainingRecordType;
  title: string;
  description: string | null;
  trainerId: number | null;
  trainerFullName?: string | null;
  traineeId: number | null;
  traineeFullName?: string | null;
  trainingDate: string;
  durationMinutes: number | null;
  outcome: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingRecordListResponse {
  items: TrainingRecord[];
  total: number;
}

export interface TrainingRecordCreateInput {
  record_type: TrainingRecordType;
  title: string;
  description?: string | null;
  trainer_id?: number | null;
  trainee_id?: number | null;
  training_date?: string;
  duration_minutes?: number | null;
  outcome?: string | null;
  tags?: string[] | null;
}

export interface TrainingRecordUpdateInput {
  title?: string;
  description?: string | null;
  trainer_id?: number | null;
  trainee_id?: number | null;
  training_date?: string;
  duration_minutes?: number | null;
  outcome?: string | null;
  tags?: string[] | null;
}

export const TRAINING_TYPE_LABELS: Record<TrainingRecordType, string> = {
  onboarding: '新人带教',
  weekly_meeting: '周例会',
  monthly_review: '月度复盘',
  case_study: '案例库'
};
