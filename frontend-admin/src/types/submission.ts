export type Submission = {
  id: string;
  site_id: string;
  submitted_by: string;
  submission_date: string;
  submission_time: string;
  status: "pending" | "approved" | "rejected";
  notes?: string | null;
  submitter_name?: string;
  site_name?: string;
};
