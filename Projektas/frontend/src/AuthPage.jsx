import { useState } from "react";
import { Leaf, Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";
import Footer from "./components/Footer.jsx";

export default function AuthPage({ onLogin, onRegister, error }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    if (mode === "login") await onLogin(email, password);
    else await onRegister(email, password);
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          {/* Paveiksliukas keicia dydi pagal lango ploti, telefone paslepiamas (zr. styles.css) */}
          <div className="auth-image">
            <img src="/images/healthy-food.jpg" alt="Sveiko maisto lėkštė" />
          </div>

          <div className="auth-form">
            <header>
              <h1><Leaf size={30} /> Mitybos sekiklis</h1>
              <p>{mode === "login" ? "Prisijunkite prie savo paskyros" : "Susikurkite naują paskyrą"}</p>
            </header>

            {/* key={error} - kad kiekviena nauja klaida is naujo paleistu "shake" animacija */}
            {error && <div key={error} className="error shake"><AlertCircle size={18} /> {error}</div>}

            <form onSubmit={handleSubmit} className="auth-fields">
              <label>El. paštas
                <span className="input-icon">
                  <Mail size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vardas@example.com" required />
                </span>
              </label>
              <label>Slaptažodis
                <span className="input-icon">
                  <Lock size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Bent 6 simboliai" required />
                </span>
              </label>
              <button disabled={submitting}>
                {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
                {submitting ? "Palaukite..." : mode === "login" ? "Prisijungti" : "Registruotis"}
              </button>
            </form>

            <p className="muted switch-mode">
              {mode === "login" ? (
                <>Neturite paskyros? <button type="button" className="link" onClick={() => setMode("register")}>Registruokitės</button></>
              ) : (
                <>Jau turite paskyrą? <button type="button" className="link" onClick={() => setMode("login")}>Prisijunkite</button></>
              )}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
