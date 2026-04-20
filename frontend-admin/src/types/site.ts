export type Site = {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  is_active: boolean;
  parameterCount?: number;
  assignmentCount?: number;
};

export type SiteParameter = {
  id: string;
  site_id: string;
  name: string;
  type: "number" | "text" | "dropdown" | "boolean" | "date";
  is_required: boolean;
  options?: string[];
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  display_order: number;
  is_active: boolean;
};
