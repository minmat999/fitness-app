import { ChevronLeft, ChevronRight } from "lucide-react";

// Puslapiavimas pagal API grazinama pagination objekta: { page, pages, total }.
export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;
  return (
    <div className="pagination">
      <button type="button" className="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={18} /> Atgal
      </button>
      <span>Puslapis {page} iš {pages}</span>
      <button type="button" className="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Pirmyn <ChevronRight size={18} />
      </button>
    </div>
  );
}
