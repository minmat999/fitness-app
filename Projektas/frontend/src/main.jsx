import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Target, Scale, Ruler, Cake, Flame, Dumbbell, Plus, Pencil, Trash2, CalendarDays,
  UtensilsCrossed, BarChart3, Sparkles, Clock, Save, LayoutDashboard
} from "lucide-react";
import "./styles.css";
import AuthPage from "./AuthPage.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Spinner from "./components/Spinner.jsx";
import FoodModal from "./components/FoodModal.jsx";
import { Modal, ConfirmModal } from "./components/Modal.jsx";
import { ToastProvider, useToast } from "./components/Toasts.jsx";
import FoodCatalog from "./pages/FoodCatalog.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import {
  API, getAccessToken, setAccessToken, onAuthChange,
  tryRefresh, logout as authLogout, fetchMe,
  login as authLogin, register as authRegister
} from "./auth";

const today = formatLocalDate(new Date());

function App({ user, onLogout }) {
  // notify - parodo toast pranesima (vietoj alert). Aprasyta components/Toasts.jsx.
  const notify = useToast();

  // view - kuris puslapis siuo metu rodomas (keiciamas per meniu Navbar komponente).
  const [view, setView] = useState("overview");

  // State yra React atmintis: kai setGoals/setFoods pakeicia reiksme, puslapis persipaiso.
  const [goals, setGoals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dayDate, setDayDate] = useState(today);
  const [mealDate, setMealDate] = useState(today);
  const [reportPeriod, setReportPeriod] = useState("day");
  const [reportDate, setReportDate] = useState(today);
  const [reportWeek, setReportWeek] = useState(`${today.slice(0, 4)}-W${weekNumber(today)}`);
  const [reportMonth, setReportMonth] = useState(today.slice(0, 7));
  const [report, setReport] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const [goalModal, setGoalModal] = useState(false);
  const [dayModal, setDayModal] = useState(false);
  const [mealModal, setMealModal] = useState(false);
  const [foodModal, setFoodModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  // confirmDialog - trynimo patvirtinimo modalo duomenys (null - modalas uzdarytas).
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Vienam naudotojui leidziamas vienas tikslas. Imame butent prisijungusio naudotojo tiksla
  // (admin gauna visu tikslus, todel negalima tiesiog imti goals[0]).
  const goal = goals.find((g) => g.userId === user.id) || null;

  // Surandame tos dienos DailyLog pagal vartotojo pasirinkta data.
  const dayLog = useMemo(() => logs.find((log) => log.date === dayDate), [logs, dayDate]);
  const mealLog = useMemo(() => logs.find((log) => log.date === mealDate), [logs, mealDate]);
  const entriesLog = mealLog || logs[0] || null;

  // Cia apskaiciuojame, kuriu pagrindiniu valgymu jau nebegalima rodyti dropdown'e.
  const takenMainMeals = entries
    .filter((entry) => !editingEntry || entry.id !== editingEntry.id)
    .map((entry) => entry.mealType);

  // useEffect paleidzia funkcijas automatiskai, kai pasikeicia priklausomybes lauztiniuose skliaustuose.
  useEffect(() => { safe(loadInitialData).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (goal) safe(() => loadLogs(goal.id)); }, [goal?.id]);
  useEffect(() => { entriesLog && goal ? safe(() => loadEntries(entriesLog.id, mealDate)) : setEntries([]); }, [entriesLog?.id, mealDate]);
  useEffect(() => { if (goal) safe(loadReport); }, [goal?.id, reportPeriod, reportDate, reportWeek, reportMonth]);
  // Suvestine perkraunama kiekviena karta grizus i Apzvalga, kad rodytu naujausius duomenis.
  useEffect(() => { if (goal && view === "overview") safe(loadDashboard); }, [goal?.id, view]);

  async function request(path, options = {}, retry = true) {
    const res = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`
      },
      credentials: "include",
      ...options
    });

    // Jei access tokenas pasibaige - automatiskai gauname nauja per refresh ir kartojame uzklausa.
    if (res.status === 401 && retry) {
      const refreshed = await tryRefresh();
      if (refreshed) return request(path, options, false);
    }

    if (!res.ok) throw new Error((await res.json()).error || "Klaida");
    return res.status === 204 ? null : res.json();
  }

  async function safe(action) {
    // safe sugauna klaidas ir parodo jas raudonu toast pranesimu, kad puslapis "nenuluztu".
    // Klaidos atveju grazina undefined (o null reiskia sekminga 204 atsakyma, pvz. istrynus).
    try {
      return await action();
    } catch (err) {
      notify(err.message || "Nepavyko atlikti veiksmo", "error");
      return undefined;
    }
  }

  // Atidaro patvirtinimo modala. onConfirm iskvieciamas tik paspaudus "Ištrinti".
  function askConfirm(options) {
    setConfirmDialog(options);
  }

  async function loadInitialData() {
    // Pirma karta uzkrauname tiksla ir maisto kataloga.
    const [goalData] = await Promise.all([
      request("/goals?limit=50"),
      loadFoods()
    ]);
    setGoals(goalData.data);
  }

  async function loadFoods() {
    // Maisto sarasas valgymo dropdown'ui.
    const foodData = await request("/foods?limit=100");
    setFoods(foodData.data);
  }

  async function loadLogs(goalId) {
    // Uzkrauname visus pasirinkto tikslo dienos irasus.
    const data = await request(`/goals/${goalId}/logs?limit=200`);
    setLogs(data.data);
  }

  async function loadEntries(logId, date = mealDate) {
    // Valgymu istorija filtruojama pagal FoodEntry.eatenAt data.
    const data = await request(`/goals/${goal.id}/logs/${logId}/entries?limit=50&date=${date}`);
    setEntries(data.data);
  }

  async function loadDashboard() {
    // Dashboard endpointas grazina duomenis is keliu lenteliu: Goal + DailyLog + FoodEntry + Food.
    const data = await request(`/goals/${goal.id}/dashboard`);
    setDashboard(data);
  }

  async function loadReport() {
    // Ataskaita priklauso nuo pasirinkto laikotarpio: dienos, savaites arba menesio.
    const data = await request(`/goals/${goal.id}/reports?period=${reportPeriod}&date=${reportDateForApi()}`);
    setReport(data.report);
  }

  async function saveGoal(event) {
    event.preventDefault();

    // FormData paima visus formos inputus pagal ju name atributa.
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.type = goalTypeFromTitle(data.title);

    const path = goal ? `/goals/${goal.id}` : "/goals";
    const method = goal ? "PUT" : "POST";

    // Jei tikslo dar nera - POST sukuria. Jei yra - PUT atnaujina.
    const saved = await safe(() => request(path, { method, body: JSON.stringify(data) }));
    if (!saved) return;

    setGoalModal(false);
    notify(goal ? "Tikslas pakeistas" : "Tikslas sukurtas");
    await safe(loadInitialData);
    await safe(() => loadLogs(saved.id));
  }

  function deleteGoal() {
    askConfirm({
      title: "Ištrinti tikslą?",
      text: "Kartu bus ištrinti visi šio tikslo dienos įrašai ir valgymai. Šio veiksmo atšaukti negalima.",
      onConfirm: async () => {
        const result = await safe(() => request(`/goals/${goal.id}`, { method: "DELETE" }));
        if (result === null) {
          // Backend istrina ir susijusius DailyLog/FoodEntry (CASCADE), todel isvalome ir juos.
          setGoals((list) => list.filter((g) => g.id !== goal.id));
          setLogs([]);
          setEntries([]);
          setReport(null);
          setDashboard(null);
          setInsight("");
          notify("Tikslas ištrintas");
        }
      }
    });
  }

  async function saveDayLog(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const isEdit = Boolean(editingLog);
    const path = isEdit ? `/goals/${goal.id}/logs/${editingLog.id}` : `/goals/${goal.id}/logs`;
    const method = isEdit ? "PUT" : "POST";

    // Dienos irasas saugo svori, aktyvuma ir komentara pasirinktai dienai.
    const saved = await safe(() => request(path, { method, body: JSON.stringify({ ...data, date: dayDate }) }));
    if (!saved) return;

    setDayModal(false);
    setEditingLog(null);
    notify(isEdit ? "Dienos įrašas pakeistas" : "Dienos įrašas sukurtas");
    await safe(() => loadLogs(goal.id));
    await safe(loadReport);
  }

  async function saveFood(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    // Naujas maistas keliauja i Foods lentele ir po to atsiranda valgymo dropdown'e.
    const saved = await safe(() => request("/foods", { method: "POST", body: JSON.stringify(data) }));
    if (!saved) return;

    setFoodModal(false);
    notify(`Maistas „${saved.name}" pridėtas į duomenų bazę`);
    await safe(loadFoods);
  }

  async function saveMeal(event) {
    event.preventDefault();
    const form = event.currentTarget;

    // Valgymas privalo priklausyti DailyLog. Jei tai dienai DailyLog dar nera, sukuriame tuscia.
    const log = editingEntry ? { id: editingEntry.dailyLogId } : (mealLog || await createEmptyLog(mealDate));
    if (!log) return;

    const data = Object.fromEntries(new FormData(form));

    // Backend laukia DATETIME, todel data + laikas sujungiami i viena eatenAt reiksme.
    data.eatenAt = `${mealDate} ${data.eatenAt || "00:00"}:00`;
    const isEdit = Boolean(editingEntry);
    const path = isEdit
      ? `/goals/${goal.id}/logs/${log.id}/entries/${editingEntry.id}`
      : `/goals/${goal.id}/logs/${log.id}/entries`;
    const method = isEdit ? "PUT" : "POST";
    const saved = await safe(() => request(path, { method, body: JSON.stringify(data) }));
    if (!saved) return;

    setMealModal(false);
    setEditingEntry(null);
    notify(isEdit ? "Valgymas pakeistas" : "Valgymas pridėtas");
    await safe(() => loadLogs(goal.id));
    await safe(() => loadEntries(log.id, mealDate));
    await safe(loadReport);
  }

  async function createEmptyLog(date) {
    // Jei vartotojas prideda valgyma dienai be DailyLog, sukuriame minimalu dienos irasa.
    const saved = await safe(() => request(`/goals/${goal.id}/logs`, {
      method: "POST",
      body: JSON.stringify({ date, activity: "medium", note: "" })
    }));
    if (!saved) {
      const data = await safe(() => request(`/goals/${goal.id}/logs?limit=200`));
      const existing = data?.data?.find((log) => log.date === date);
      return existing || null;
    }
    await safe(() => loadLogs(goal.id));
    return saved;
  }

  function deleteLog(log) {
    askConfirm({
      title: "Ištrinti dienos įrašą?",
      text: `Bus ištrintas ${log.date} dienos įrašas ir visi tos dienos valgymai.`,
      onConfirm: async () => {
        const deleted = await safe(() => request(`/goals/${goal.id}/logs/${log.id}`, { method: "DELETE" }));
        if (deleted === null) {
          notify("Dienos įrašas ištrintas");
          await safe(() => loadLogs(goal.id));
          setEntries([]);
          await safe(loadReport);
        }
      }
    });
  }

  function deleteEntry(entry) {
    askConfirm({
      title: "Ištrinti valgymą?",
      text: `Bus ištrintas valgymas: ${entry.foodName}, ${entry.quantityGrams} g.`,
      onConfirm: async () => {
        const deleted = await safe(() => request(`/goals/${goal.id}/logs/${entry.dailyLogId}/entries/${entry.id}`, { method: "DELETE" }));
        if (deleted === null) {
          notify("Valgymas ištrintas");
          await safe(() => loadEntries(entry.dailyLogId, mealDate));
          await safe(loadReport);
        }
      }
    });
  }

  async function loadInsight() {
    // DI izvalga generuojama pagal ta pati laikotarpi, kuris pasirinktas ataskaitoje.
    setInsightLoading(true);
    setInsight("");
    const data = await safe(() => request(`/goals/${goal.id}/insights?period=${reportPeriod}&date=${reportDateForApi()}`, { method: "POST" }));
    if (data) setInsight(data.insight);
    setInsightLoading(false);
  }

  function reportDateForApi() {
    if (reportPeriod === "week") return firstDateOfWeek(reportWeek);
    if (reportPeriod === "month") return `${reportMonth}-01`;
    return reportDate;
  }

  function openDayModal(log) {
    setEditingLog(log || null);
    setDayModal(true);
  }

  function openMealModal(entry) {
    setEditingEntry(entry || null);
    setMealModal(true);
  }

  // Kiekvienam meniu punktui - atskiras turinys.
  function renderView() {
    if (!loaded) return <Spinner text="Kraunami duomenys..." />;

    if (view === "foods") {
      return (
        <FoodCatalog
          request={request}
          safe={safe}
          isAdmin={user.role === "admin"}
          askConfirm={askConfirm}
          onCatalogChange={() => safe(loadFoods)}
        />
      );
    }
    if (view === "users" && user.role === "admin") {
      return <AdminUsers request={request} safe={safe} currentUser={user} askConfirm={askConfirm} />;
    }
    if (view === "overview") {
      return (
        <>
          <Hero onAddMeal={() => setView("meals")} hasGoal={Boolean(goal)} />
          <section className="card">
            <div className="section-title">
              <h2><Target size={24} /> Mano tikslas</h2>
              <div className="actions">
                <button type="button" onClick={() => setGoalModal(true)}>
                  {goal ? <><Pencil size={18} /> Keisti</> : <><Plus size={18} /> Sukurti tikslą</>}
                </button>
                {goal && <button type="button" className="danger" onClick={deleteGoal}><Trash2 size={18} /> Trinti</button>}
              </div>
            </div>
            {goal ? <GoalSummary goal={goal} /> : <p className="empty">Tikslas dar nesukurtas. Sukurkite jį, kad galėtumėte žymėti dienas ir valgymus.</p>}
          </section>
          {goal && <DashboardSummary dashboard={dashboard} />}
        </>
      );
    }

    // Likusiems puslapiams reikalingas tikslas (hierarchija: Goal -> DailyLog -> FoodEntry).
    if (!goal) return <NeedGoal onCreate={() => { setView("overview"); setGoalModal(true); }} />;

    if (view === "days") {
      return (
        <section className="card">
          <div className="section-title">
            <h2><CalendarDays size={24} /> Dienos įrašai</h2>
            <button type="button" onClick={() => openDayModal(dayLog)}>
              {dayLog ? <><Pencil size={18} /> Keisti įrašą</> : <><Plus size={18} /> Pridėti įrašą</>}
            </button>
          </div>
          <label className="date-filter">Rodoma diena<input type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} /></label>
          <ul className="history">
            {dayLog ? (
              <li>
                <span>{dayLog.date} - {activityName(dayLog.activity)} - {dayLog.note || "Komentaro nėra"}</span>
                <strong>{dayLog.weightKg ? `${dayLog.weightKg} kg` : "Svoris nenurodytas"}</strong>
                <button type="button" className="secondary" onClick={() => openDayModal(dayLog)}><Pencil size={16} /> Keisti</button>
                <button type="button" className="danger" onClick={() => deleteLog(dayLog)}><Trash2 size={16} /> Trinti</button>
              </li>
            ) : <li className="empty">Šiai dienai dienos įrašo nėra.</li>}
          </ul>
        </section>
      );
    }

    if (view === "meals") {
      return (
        <section className="card">
          <div className="section-title">
            <h2><UtensilsCrossed size={24} /> Valgymų istorija</h2>
            <div className="actions">
              <button type="button" className="secondary" onClick={() => setFoodModal(true)}><Plus size={18} /> Naujas maistas</button>
              <button type="button" onClick={() => openMealModal(null)}><Plus size={18} /> Pridėti valgymą</button>
            </div>
          </div>
          <label className="date-filter">Rodoma diena<input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} /></label>
          <ul className="history">
            {entries.map((entry) => (
              <li key={entry.id}>
                <span>
                  <Clock size={14} /> {entry.eatenAtTime || "--:--"} - {mealName(entry.mealType)} - {entry.foodName}, {entry.quantityGrams} g
                  <small>Energetinė vertė: {entry.totals.calories} kcal, baltymai {entry.totals.protein} g, angliavandeniai {entry.totals.carbs} g, riebalai {entry.totals.fat} g</small>
                </span>
                <strong>{entry.totals.calories} kcal</strong>
                <button type="button" className="secondary" onClick={() => openMealModal(entry)}><Pencil size={16} /> Keisti</button>
                <button type="button" className="danger" onClick={() => deleteEntry(entry)}><Trash2 size={16} /> Trinti</button>
              </li>
            ))}
            {!entries.length && <li className="empty">Šiai dienai valgymų nėra.</li>}
          </ul>
        </section>
      );
    }

    if (view === "reports") {
      return (
        <section className="card">
          <h2><BarChart3 size={24} /> Ataskaitos</h2>
          <div className="toolbar">
            <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
              <option value="day">Diena</option>
              <option value="week">Savaitė</option>
              <option value="month">Mėnuo</option>
            </select>
            {reportPeriod === "day" && <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />}
            {reportPeriod === "week" && <input type="week" value={reportWeek} onChange={(e) => setReportWeek(e.target.value)} />}
            {reportPeriod === "month" && <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} />}
          </div>
          <Report report={report} />
        </section>
      );
    }

    if (view === "insights") {
      return (
        <section className="card">
          <h2><Sparkles size={24} /> DI įžvalgos</h2>
          <p className="hint">Įžvalga generuojama pagal ataskaitose pasirinktą laikotarpį.</p>
          <button type="button" onClick={loadInsight} disabled={insightLoading}>
            <Sparkles size={18} /> Gauti įžvalgą
          </button>
          {insightLoading && <Spinner text="Rengiama įžvalga..." />}
          {insight && <p className="insight">{insight}</p>}
        </section>
      );
    }

    return null;
  }

  return (
    <div className="app-shell">
      <Navbar view={view} onNavigate={setView} user={user} onLogout={onLogout} />

      <main className="content">
        {/* key={view} - pakeitus puslapi, turinys sukuriamas is naujo ir suveikia "fade-in" animacija */}
        <div key={view} className="view">{renderView()}</div>
      </main>

      <Footer />

      {goalModal && <GoalModal goal={goal} onClose={() => setGoalModal(false)} onSubmit={saveGoal} />}
      {dayModal && <DayLogModal log={editingLog} date={dayDate} onClose={() => setDayModal(false)} onSubmit={saveDayLog} />}
      {foodModal && <FoodModal onClose={() => setFoodModal(false)} onSubmit={saveFood} />}
      {mealModal && (
        <MealModal
          foods={foods}
          entry={editingEntry}
          takenMainMeals={takenMainMeals}
          onClose={() => setMealModal(false)}
          onSubmit={saveMeal}
        />
      )}
      {confirmDialog && <ConfirmModal {...confirmDialog} onClose={() => setConfirmDialog(null)} />}
    </div>
  );
}

function Hero({ onAddMeal, hasGoal }) {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Sveiki!</h1>
        <p>Žymėkite valgymus, stebėkite kalorijas ir artėkite prie savo tikslo kiekvieną dieną.</p>
        {hasGoal && <button type="button" onClick={onAddMeal}><UtensilsCrossed size={18} /> Žymėti valgymą</button>}
      </div>
      {/* Paveiksliukas prisitaiko prie lango dydzio: width: 100% ir height: auto (zr. .hero-image) */}
      <img className="hero-image" src="/images/healthy-food.jpg" alt="Sveiko maisto lėkštė su daržovėmis ir vaisiais" />
    </section>
  );
}

// Suvestine is GET /goals/:id/dashboard - viso laikotarpio statistika ir 5 paskutiniai valgymai.
function DashboardSummary({ dashboard }) {
  if (!dashboard) return <section className="card"><Spinner text="Kraunama suvestinė..." /></section>;
  const { summary, recentEntries } = dashboard;
  return (
    <section className="card">
      <h2><LayoutDashboard size={24} /> Suvestinė</h2>
      <div className="summary details">
        <span>Dienų su valgymais: {summary.daysLogged}</span>
        <span>Valgymų iš viso: {summary.entriesLogged}</span>
      </div>
      <h3 className="subtitle">Vidutiniškai per dieną</h3>
      <div className="progress-grid">
        <ProgressBar icon={Flame} label="Kalorijos" value={summary.averageCaloriesPerDay} target={summary.caloriesTarget} unit="kcal" />
        <ProgressBar icon={Dumbbell} label="Baltymai" value={summary.averageProteinPerDay} target={summary.proteinTarget} unit="g" />
      </div>
      <h3 className="subtitle">Paskutiniai valgymai</h3>
      <ul className="history">
        {recentEntries.map((entry) => (
          <li key={entry.id}>
            <span><Clock size={14} /> {entry.eatenAtDate} {entry.eatenAtTime} - {mealName(entry.mealType)} - {entry.foodName}, {entry.quantityGrams} g</span>
            <strong>{entry.totals.calories} kcal</strong>
          </li>
        ))}
        {!recentEntries.length && <li className="empty">Valgymų dar nėra.</li>}
      </ul>
    </section>
  );
}

// Progreso juosta: kiek procentu dienos tikslo vidutiniskai pasiekiama.
// Juostos plotis animuojamas CSS (transition: width), virs 100% juosta tampa oranzine.
function ProgressBar({ icon: Icon, label, value, target, unit }) {
  const percent = target ? Math.round((value / target) * 100) : 0;
  return (
    <div className="progress">
      <div className="progress-head">
        <span><Icon size={18} /> {label}</span>
        <strong>{value} / {target} {unit} ({percent}%)</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${percent > 100 ? "over" : ""}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function NeedGoal({ onCreate }) {
  return (
    <section className="card empty-state">
      <Target size={48} />
      <h2>Pirmiausia susikurkite tikslą</h2>
      <p>Dienos įrašai, valgymai ir ataskaitos priklauso jūsų tikslui.</p>
      <button type="button" onClick={onCreate}><Plus size={18} /> Sukurti tikslą</button>
    </section>
  );
}

function GoalSummary({ goal }) {
  // Kiekvienas rodiklis - atskira kortele su ikonele.
  const stats = [
    { icon: Target, label: "Tikslas", value: goalName(goal.title) },
    { icon: Scale, label: "Pradinis svoris", value: `${goal.startWeightKg} kg` },
    { icon: Scale, label: "Tikslo svoris", value: `${goal.targetWeightKg} kg` },
    { icon: Ruler, label: "Ūgis", value: `${goal.heightCm} cm` },
    { icon: Cake, label: "Amžius", value: goal.age },
    { icon: Flame, label: "Kalorijų tikslas", value: `${goal.dailyCaloriesTarget} kcal` },
    { icon: Dumbbell, label: "Baltymų tikslas", value: `${goal.dailyProteinTarget} g` }
  ];
  return (
    <div className="stat-grid">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="stat">
          <Icon size={22} />
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalModal({ goal, onClose, onSubmit }) {
  return (
    <Modal title={goal ? "Keisti tikslą" : "Sukurti tikslą"} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid">
        <label>Tikslas
          <select name="title" defaultValue={goal?.title || "Mazinti svori"} required>
            <option value="Mazinti svori">Mažinti svorį</option>
            <option value="Auginti raumenis">Auginti raumenis</option>
            <option value="Islaikyti svori">Išlaikyti svorį</option>
          </select>
        </label>
        <label>Pradinis svoris, kg<input name="startWeightKg" type="number" step="0.1" min="20" defaultValue={goal?.startWeightKg || ""} required /></label>
        <label>Tikslo svoris, kg<input name="targetWeightKg" type="number" step="0.1" min="20" defaultValue={goal?.targetWeightKg || ""} required /></label>
        <label>Ūgis, cm<input name="heightCm" type="number" min="100" defaultValue={goal?.heightCm || ""} required /></label>
        <label>Amžius<input name="age" type="number" min="10" defaultValue={goal?.age || ""} required /></label>
        <p className="hint wide">Kalorijų ir baltymų tikslas bus perskaičiuotas automatiškai.</p>
        <div className="modal-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Atšaukti</button>
          <button><Save size={18} /> {goal ? "Patvirtinti pakeitimą" : "Sukurti tikslą"}</button>
        </div>
      </form>
    </Modal>
  );
}

function DayLogModal({ log, date, onClose, onSubmit }) {
  return (
    <Modal title={log ? "Keisti dienos įrašą" : "Pridėti dienos įrašą"} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid">
        <p className="hint wide">Diena: {date}</p>
        <label>Svoris, kg<input name="weightKg" type="number" step="0.1" min="20" defaultValue={log?.weightKg || ""} /></label>
        <label>Aktyvumas
          <select name="activity" defaultValue={log?.activity || "medium"}>
            <option value="low">Mažas</option>
            <option value="medium">Vidutinis</option>
            <option value="high">Didelis</option>
          </select>
        </label>
        <label className="wide">Komentaras
          <textarea name="note" rows="5" defaultValue={log?.note || ""} placeholder="Kaip sekėsi diena, alkis, energija, treniruotė..." />
        </label>
        <div className="modal-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Atšaukti</button>
          <button><Save size={18} /> {log ? "Išsaugoti pakeitimus" : "Pridėti įrašą"}</button>
        </div>
      </form>
    </Modal>
  );
}

function MealModal({ foods, entry, takenMainMeals, onClose, onSubmit }) {
  const mealOptions = availableMealOptions(takenMainMeals, entry?.mealType);
  return (
    <Modal title={entry ? "Keisti valgymą" : "Pridėti valgymą"} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid">
        <label>Maistas iš duomenų bazės
          <select name="foodId" defaultValue={entry?.foodId || ""} required>
            <option value="">Pasirinkite maistą</option>
            {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
          </select>
        </label>
        <label>Kiekis, g<input name="quantityGrams" type="number" step="0.1" min="1" defaultValue={entry?.quantityGrams || ""} required /></label>
        <label>Valgymas
          <select name="mealType" defaultValue={entry?.mealType || firstAvailableMeal(takenMainMeals)}>
            {mealOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>Laikas<input name="eatenAt" type="time" defaultValue={entry?.eatenAtTime || ""} /></label>
        <div className="modal-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Atšaukti</button>
          <button><Save size={18} /> {entry ? "Išsaugoti pakeitimus" : "Pridėti valgymą"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Report({ report }) {
  if (!report) return <Spinner text="Ataskaita kraunama..." />;
  const { totals, targets, difference } = report.summary;
  const sign = (n) => (n > 0 ? "+" : "");
  return (
    <div>
      <div className="summary">
        <span>Dienos: {report.summary.days}</span>
        <span>Kalorijų tikslas: {targets.calories} kcal</span>
        <span>Suvartota: {totals.calories} kcal</span>
        <span>Skirtumas: {sign(difference.calories)}{difference.calories} kcal</span>
        <span>Baltymų tikslas: {targets.protein} g</span>
        <span>Suvartota baltymų: {totals.protein} g</span>
        <span>Skirtumas: {sign(difference.protein)}{difference.protein} g</span>
      </div>
      <ul className="history">
        {report.days.map((day) => (
          <li key={day.date}>
            <span>{day.date} - {activityName(day.activity)}</span>
            <strong>{day.totals.calories} kcal</strong>
          </li>
        ))}
        {!report.days.length && <li className="empty">Pasirinktam laikotarpiui įrašų nėra.</li>}
      </ul>
    </div>
  );
}

function firstAvailableMeal(takenMainMeals) {
  if (!takenMainMeals.includes("breakfast")) return "breakfast";
  if (!takenMainMeals.includes("lunch")) return "lunch";
  if (!takenMainMeals.includes("dinner")) return "dinner";
  return "snack";
}

function availableMealOptions(takenMainMeals, currentMealType) {
  const options = [
    { value: "breakfast", label: "Pusryčiai" },
    { value: "lunch", label: "Pietūs" },
    { value: "dinner", label: "Vakarienė" },
    { value: "snack", label: "Užkandis" }
  ];
  return options.filter((option) => (
    option.value === "snack" ||
    option.value === currentMealType ||
    !takenMainMeals.includes(option.value)
  ));
}

function mealName(type) {
  return { breakfast: "Pusryčiai", lunch: "Pietūs", dinner: "Vakarienė", snack: "Užkandis" }[type] || type;
}

function activityName(activity) {
  return { low: "Mažas aktyvumas", medium: "Vidutinis aktyvumas", high: "Didelis aktyvumas" }[activity] || "Aktyvumas nenurodytas";
}

function goalName(title) {
  return { "Mazinti svori": "Mažinti svorį", "Auginti raumenis": "Auginti raumenis", "Islaikyti svori": "Išlaikyti svorį" }[title] || title;
}

function goalTypeFromTitle(title) {
  if (title === "Auginti raumenis") return "muscle_gain";
  if (title === "Islaikyti svori") return "maintain";
  return "weight_loss";
}

function weekNumber(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / 86400000);
  return String(Math.ceil((days + start.getDay() + 1) / 7)).padStart(2, "0");
}

function firstDateOfWeek(weekText) {
  const [year, weekPart] = weekText.split("-W");
  const date = new Date(Number(year), 0, 1 + (Number(weekPart) - 1) * 7);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return formatLocalDate(date);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AuthGate() {
  const notify = useToast();
  const [token, setToken] = useState(getAccessToken());
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(setToken);
    (async () => {
      const ok = await tryRefresh(); // bandome atsistatyti sesija po puslapio perkrovimo
      if (ok) await loadUser();
      setChecking(false);
    })();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (token) loadUser();
    else setUser(null);
  }, [token]);

  async function loadUser() {
    try {
      const me = await fetchMe();
      setUser(me.user || me);
    } catch {
      setAccessToken(null);
    }
  }

  async function handleLogin(email, password) {
    setAuthError("");
    try {
      await authLogin(email, password);
      notify("Sėkmingai prisijungėte");
    } catch (err) { setAuthError(err.message); }
  }

  async function handleRegister(email, password) {
    setAuthError("");
    try {
      await authRegister(email, password);
      await authLogin(email, password); // po registracijos iskart prisijungiam
      notify("Paskyra sukurta. Sveiki prisijungę!");
    } catch (err) { setAuthError(err.message); }
  }

  async function handleLogout() {
    await authLogout();
    setUser(null);
    notify("Atsijungėte", "info");
  }

  if (checking) return <div className="center-screen"><Spinner text="Tikrinama sesija..." /></div>;
  if (!token || !user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} error={authError} />;
  return <App user={user} onLogout={handleLogout} />;
}

// ToastProvider apgaubia visa programa, kad toast pranesimus galetu rodyti bet kuris komponentas.
createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <AuthGate />
  </ToastProvider>
);
