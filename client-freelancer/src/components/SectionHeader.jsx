export default function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
