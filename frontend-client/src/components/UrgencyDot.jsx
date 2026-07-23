export default function UrgencyDot({ urgency }) {
  const c = urgency === "high" ? "bg-red-500" : urgency === "medium" ? "bg-amber-400" : "bg-emerald-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${c}`} />;
}
