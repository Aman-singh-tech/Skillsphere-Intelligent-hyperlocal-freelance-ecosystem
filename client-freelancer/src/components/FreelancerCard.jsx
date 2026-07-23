import { MapPin, Star } from "lucide-react";
import { pill } from "../utils/constants";
import Avatar from "./Avatar";

export default function FreelancerCard({ f }) {
  const badgeStyle =
    f.badge === "Top Rated"
      ? "bg-amber-100 text-amber-700"
      : f.badge === "Verified"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-blue-100 text-blue-700";
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group cursor-pointer">
      <div className="flex items-start gap-3 mb-3">
        <div className="relative">
          <Avatar initials={f.avatar} color={f.color} />
          {f.available && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm truncate">{f.name}</p>
            <span className={`${pill} text-[10px] ${badgeStyle}`}>{f.badge}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{f.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{f.location}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-foreground">{f.rating}</span>
          <span className="text-xs text-muted-foreground">({f.reviews})</span>
        </div>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs font-semibold text-foreground">{f.rate}</span>
        <span className="ml-auto text-xs font-mono text-primary font-semibold">{f.score}% match</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {f.skills.map((s) => (
          <span key={s} className={`${pill} bg-muted text-muted-foreground`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
