/** Site footer for ClearPath. */
export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-20 py-8 text-center text-xs text-slate-600">
      <p>
        ClearPath — AI-powered legal document analysis.{" "}
        <span className="text-slate-700">Not legal advice.</span>
      </p>
      <p className="mt-1">
        Built with{" "}
        <a
          href="https://fastapi.tiangolo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors"
        >
          FastAPI
        </a>
        ,{" "}
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors"
        >
          Next.js
        </a>
        {" & "}
        <a
          href="https://anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors"
        >
          Claude
        </a>
        .
      </p>
    </footer>
  );
}
