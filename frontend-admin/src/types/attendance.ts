export type Attendance = {
  id: string;
  user_id: string;
  site_id: string;
  attendance_date: string;
  check_in: string;
  check_out?: string | null;
  status: "present" | "absent" | "late";
  user_name?: string;
  site_name?: string;
};
