/** Small pill badge for displaying key terms from a clause. */
interface KeyTermPillProps {
  term: string;
}

export default function KeyTermPill({ term }: KeyTermPillProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300 border border-slate-600/50 font-mono">
      {term}
    </span>
  );
}
