import JobForm from "@/components/forms/JobForm";
import JobPostList from "@/components/admin/JobPostList";

export default function AdminJobsManager() {
  return (
    <>
      <JobForm />
      <JobPostList refreshKey={0} />
    </>
  );
}