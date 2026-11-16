import { useState } from "react";
import {
  Leaf, LayoutDashboard, CalendarDays, UtensilsCrossed, Apple, BarChart3,
  Sparkles, Users, LogOut, Menu, X, ShieldCheck, User
} from "lucide-react";

// Meniu punktai. Kiekvienas turi savo SVG ikonele is lucide-react bibliotekos.
const MENU = [
  { view: "overview", label: "Apžvalga", icon: LayoutDashboard },
  { view: "days", label: "Dienos įrašai", icon: CalendarDays },
  { view: "meals", label: "Valgymai", icon: UtensilsCrossed },
  { view: "foods", label: "Maisto katalogas", icon: Apple },
  { view: "reports", label: "Ataskaitos", icon: BarChart3 },
  { view: "insights", label: "DI įžvalgos", icon: Sparkles },
  { view: "users", label: "Naudotojai", icon: Users, adminOnly: true }
];

export default function Navbar({ view, onNavigate, user, onLogout }) {
  // open - ar mobilioje versijoje atidarytas "hamburger" meniu.
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  function go(nextView) {
    onNavigate(nextView);
    setOpen(false); // paspaudus punkta telefone, meniu uzsidaro
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => go("overview")}>
          <Leaf size={26} />
          <span>Mitybos sekiklis</span>
        </button>

        {/* Hamburger mygtukas matomas tik mazame ekrane (zr. @media styles.css) */}
        <button
          type="button"
          className="hamburger"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Uždaryti meniu" : "Atidaryti meniu"}
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>

        <nav className={`main-nav ${open ? "open" : ""}`}>
          <ul>
            {MENU.filter((item) => !item.adminOnly || isAdmin).map(({ view: itemView, label, icon: Icon }) => (
              <li key={itemView}>
                <button
                  type="button"
                  className={`nav-link ${view === itemView ? "active" : ""}`}
                  onClick={() => go(itemView)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="user-box">
            <span className="user-info">
              {isAdmin ? <ShieldCheck size={18} /> : <User size={18} />}
              <span>
                {user?.email}
                <small>{isAdmin ? "administratorius" : "vartotojas"}</small>
              </span>
            </span>
            <button type="button" className="secondary" onClick={onLogout}>
              <LogOut size={18} /> Atsijungti
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
