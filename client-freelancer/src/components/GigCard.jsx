import { DollarSign, Clock, Users } from "lucide-react";
import { pill } from "../utils/constants";
import UrgencyDot from "./UrgencyDot";

export default function GigCard({ g, showApply, onApply }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm leading-snug flex-1 mr-2">{g.title}</h3>
        <UrgencyDot urgency={g.urgency} />
      </div>
      <p className="text-xs text-muted-foreground mb-3">{g.client}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {g.skills.map((s) => (
          <span key={s} className={`${pill} bg-secondary text-secondary-foreground`}>
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <DollarSign size={11} />
          <span className="font-semibold text-foreground">{g.budget}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {g.duration}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Users size={11} />
          {g.proposals} proposals
        </div>
      </div>
      {showApply && (
        <button
          onClick={() => onApply(g)}
          className="w-full mt-3 bg-primary text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply now
        </button>
      )}
    </div>
  );
}
