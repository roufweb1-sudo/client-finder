import { Suspense } from "react";
import ReportView from "./ReportView";

async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportView id={decodeURIComponent(id)} />;
}

export default function ReportPage(props: PageProps<"/report/[id]">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading report…</p>}>
      <Report params={props.params} />
    </Suspense>
  );
}
