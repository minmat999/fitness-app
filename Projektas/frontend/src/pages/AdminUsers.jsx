import { useEffect, useState } from "react";
import { Users, Trash2, ShieldCheck, Eye } from "lucide-react";
import Pagination from "../components/Pagination.jsx";
import { Modal } from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toasts.jsx";

// Naudotoju valdymas - si puslapi mato tik admin (meniu punktas rodomas tik adminui, o backend tikrina authorize("admin")).
export default function AdminUsers({ request, safe, currentUser, askConfirm }) {
  const notify = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // details - pasirinkto naudotojo duomenys su jo tikslu (GET /users/:id), null - modalas uzdarytas
  const [details, setDetails] = useState(null);

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    const data = await safe(() => request(`/users?page=${page}&limit=10`));
    if (data) {
      setUsers(data.data);
      setPagination(data.pagination);
    }
    setLoading(false);
  }

  async function showDetails(user) {
    const data = await safe(() => request(`/users/${user.id}`));
    if (data) setDetails(data);
  }

  async function changeRole(user, role) {
    const saved = await safe(() => request(`/users/${user.id}`, { method: "PUT", body: JSON.stringify({ role }) }));
    if (!saved) return;
    notify(`${saved.email} rolė pakeista į „${role === "admin" ? "administratorius" : "vartotojas"}"`);
    await load();
  }

  function removeUser(user) {
    askConfirm({
      title: "Ištrinti naudotoją?",
      text: `Naudotojas ${user.email} ir visi jo duomenys (tikslas, dienos įrašai, valgymai) bus ištrinti.`,
      onConfirm: async () => {
        const result = await safe(() => request(`/users/${user.id}`, { method: "DELETE" }));
        if (result === null) {
          notify("Naudotojas ištrintas");
          await load();
        }
      }
    });
  }

  return (
    <section className="card">
      <div className="section-title">
        <h2><Users size={24} /> Naudotojai</h2>
        <span className="badge"><ShieldCheck size={16} /> Tik administratoriui</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>El. paštas</th><th>Rolė</th><th>Sukurtas</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUser.id;
                return (
                  <tr key={user.id}>
                    <td data-label="El. paštas">{user.email}{isSelf && <small className="hint"> (jūs)</small>}</td>
                    <td data-label="Rolė">
                      {/* Savo roles admin pakeisti negali, kad netycia neliktu be admin teisiu */}
                      <select value={user.role} disabled={isSelf} onChange={(e) => changeRole(user, e.target.value)}>
                        <option value="user">Vartotojas</option>
                        <option value="admin">Administratorius</option>
                      </select>
                    </td>
                    <td data-label="Sukurtas">{new Date(user.createdAt).toLocaleDateString("lt-LT")}</td>
                    <td className="row-actions">
                      <button type="button" className="secondary" onClick={() => showDetails(user)}>
                        <Eye size={16} /> Peržiūrėti
                      </button>
                      <button type="button" className="danger" disabled={isSelf} onClick={() => removeUser(user)}>
                        <Trash2 size={16} /> Trinti
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />

      {details && (
        <Modal title="Naudotojo informacija" onClose={() => setDetails(null)}>
          <div className="summary details">
            <span>El. paštas: {details.email}</span>
            <span>Rolė: {details.role === "admin" ? "administratorius" : "vartotojas"}</span>
            <span>Sukurtas: {new Date(details.createdAt).toLocaleDateString("lt-LT")}</span>
          </div>
          <h3 className="subtitle">Tikslas</h3>
          {details.goal ? (
            <div className="summary details">
              <span>Pradinis svoris: {details.goal.startWeightKg} kg</span>
              <span>Tikslo svoris: {details.goal.targetWeightKg} kg</span>
              <span>Kalorijų tikslas: {details.goal.dailyCaloriesTarget} kcal</span>
              <span>Baltymų tikslas: {details.goal.dailyProteinTarget} g</span>
            </div>
          ) : <p className="empty">Naudotojas tikslo dar neturi.</p>}
        </Modal>
      )}
    </section>
  );
}
