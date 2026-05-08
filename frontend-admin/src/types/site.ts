export type Site = {
  id: string;
  created_by?: string | null;
  name: string;
  location: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  created_by_name?: string | null;
  createdByName?: string | null;
  created_by_role?: string | null;
  createdByRole?: string | null;
  created_by_email?: string | null;
  createdByEmail?: string | null;
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
