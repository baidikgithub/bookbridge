export type Drive = {
  id: number;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  titles: number;
  copies: number;
};

export type CreateDriveInput = { name: string; starts_on?: string; ends_on?: string };
