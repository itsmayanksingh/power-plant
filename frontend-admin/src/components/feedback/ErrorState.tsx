import { ErrorLogView } from "@/components/feedback/ErrorLogView";

export function ErrorState({ message, details }: { message: string; details?: string }) {
  return <ErrorLogView message={message} details={details} />;
}
