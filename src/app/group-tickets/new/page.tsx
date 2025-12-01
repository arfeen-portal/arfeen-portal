import GroupTicketBatchForm from "@/components/GroupTicketBatchForm";

export default function NewGroupTicketBatchPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <a href="/group-tickets" className="text-blue-600 text-sm">
        &larr; Back to group tickets
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-4">New Group Ticket Batch</h1>
      <GroupTicketBatchForm />
    </div>
  );
}
