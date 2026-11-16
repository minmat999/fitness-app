import { useEffect, useState } from "react";
import { Apple, Plus, Pencil, Trash2, Search, Flame, Beef, Wheat, Droplet } from "lucide-react";
import FoodModal from "../components/FoodModal.jsx";
import Pagination from "../components/Pagination.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toasts.jsx";

// Maisto katalogas: matyti ir prideti gali visi, redaguoti ir trinti - tik admin (taip pat tikrina ir backend).
export default function FoodCatalog({ request, safe, isAdmin, askConfirm, onCatalogChange }) {
  const notify = useToast();
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(""); // tai, kas irasyta paieskos laukelyje
  const [query, setQuery] = useState("");   // tai, pagal ka is tikruju ieskoma (po "Ieškoti")
  const [loading, setLoading] = useState(true);
  // undefined - modalas uzdarytas, null - kuriamas naujas maistas, objektas - redaguojamas maistas
  const [editing, setEditing] = useState(undefined);

  useEffect(() => { load(); }, [page, query]);

  async function load() {
    setLoading(true);
    const data = await safe(() => request(`/foods?page=${page}&limit=8&search=${encodeURIComponent(query)}`));
    if (data) {
      setFoods(data.data);
      setPagination(data.pagination);
    }
    setLoading(false);
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  async function saveFood(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const isEdit = Boolean(editing);
    const path = isEdit ? `/foods/${editing.id}` : "/foods";
    const saved = await safe(() => request(path, { method: isEdit ? "PUT" : "POST", body: JSON.stringify(data) }));
    if (!saved) return;
    setEditing(undefined);
    notify(isEdit ? `Maistas „${saved.name}" atnaujintas` : `Maistas „${saved.name}" pridėtas`);
    await load();
    onCatalogChange();
  }

  function removeFood(food) {
    askConfirm({
      title: "Ištrinti maistą?",
      text: `Maistas „${food.name}" bus pašalintas iš katalogo. Jei jis jau naudojamas valgymuose, ištrinti nepavyks.`,
      onConfirm: async () => {
        const result = await safe(() => request(`/foods/${food.id}`, { method: "DELETE" }));
        if (result === null) {
          notify("Maistas ištrintas");
          await load();
          onCatalogChange();
        }
      }
    });
  }

  return (
    <section className="card">
      <div className="section-title">
        <h2><Apple size={24} /> Maisto katalogas</h2>
        <button type="button" onClick={() => setEditing(null)}><Plus size={18} /> Pridėti maistą</button>
      </div>

      <form className="search-bar" onSubmit={submitSearch}>
        <Search size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ieškoti pagal pavadinimą..." />
        <button className="secondary">Ieškoti</button>
      </form>

      {loading ? <Spinner /> : (
        <div className="food-grid">
          {foods.map((food) => (
            <article key={food.id} className="food-card">
              <h3>{food.name}</h3>
              <ul className="macro-list">
                <li><Flame size={16} /> {food.caloriesPer100g} kcal</li>
                <li><Beef size={16} /> {food.proteinPer100g} g baltymų</li>
                <li><Wheat size={16} /> {food.carbsPer100g} g angliav.</li>
                <li><Droplet size={16} /> {food.fatPer100g} g riebalų</li>
              </ul>
              <small className="hint">100 g produkto</small>
              {isAdmin && (
                <div className="card-actions">
                  <button type="button" className="secondary" onClick={() => setEditing(food)}><Pencil size={16} /> Keisti</button>
                  <button type="button" className="danger" onClick={() => removeFood(food)}><Trash2 size={16} /> Trinti</button>
                </div>
              )}
            </article>
          ))}
          {!foods.length && <p className="empty">Maisto nerasta.</p>}
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />

      {editing !== undefined && <FoodModal food={editing} onClose={() => setEditing(undefined)} onSubmit={saveFood} />}
    </section>
  );
}
