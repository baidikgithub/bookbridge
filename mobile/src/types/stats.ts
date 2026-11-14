export type Count = { label: string; count: number };

export type Stats = {
  titles: number;
  total: number;
  available: number;
  donated: number;
  by_subject: Count[];
  by_grade: Count[];
  monthly: { month: string; collected: number; donated: number }[];
};
