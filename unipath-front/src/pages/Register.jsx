import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import etudiantsImage from '../assets/etudiants.jpg';

// Hook responsive
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 0,
    tag: "Module 1",
    title: ["Inscrivez-vous aux", "concours universitaires"],
    accent: "concours universitaires",
    desc: "De la candidature à la convocation, tout se fait en ligne. Plus de déplacements, plus de files d'attente.",
    tab: "Concours",
    steps: [
      { name: "Créez votre compte candidat", sub: "Vérification via l'ANIP ou saisie manuelle" },
      { name: "Soumettez votre dossier", sub: "Pièces justificatives & choix des concours" },
      { name: "Commission valide", sub: "Traitement en ligne, notification par email" },
      { name: "Téléchargez votre convocation", sub: "PDF généré automatiquement avec date et salle" },
    ],
  },
  {
    id: 1,
    tag: "Module 2",
    title: ["Suivez votre", "parcours académique"],
    accent: "parcours académique",
    desc: "De la Licence au Master, vos résultats et inscriptions centralisés en un seul endroit.",
    tab: "Parcours académique",
    steps: [
      { name: "Obtenez votre matricule national", sub: "Identifiant unique pour tout votre cursus" },
      { name: "Inscrivez-vous par année", sub: "Public ou privé, même procédure unifiée" },
      { name: "Consultez vos résultats", sub: "Notes et relevés disponibles en temps réel" },
      { name: "Passez en Master sans friction", sub: "Passerelle automatique après validation Licence" },
    ],
  },
];

const ROLES = [
  "CANDIDAT",
  "COMMISSION", 
  "DGES"
];

const ROLE_LABELS = {
  "CANDIDAT": "Candidat (bachelier)",
  "COMMISSION": "Membre de commission",
  "DGES": "Administrateur DGES"
};

// ── STYLES (inline) ───────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef0f5",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "24px 16px",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${etudiantsImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 58, 138, 0.15)", // Overlay léger pour garder la lisibilité
    zIndex: 1,
  },
  wrap: {
    display: "flex",
    width: "100%",
    maxWidth: 940,
    minHeight: 600,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
    position: "relative",
    zIndex: 2,
    flexDirection: "row", // desktop: côte à côte
  },
  left: {
    flex: 1,
    background: "#fff",
    padding: "44px 48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  right: {
    display: "flex",
    width: "46%",
    background: "rgb(30, 58, 138)",
    padding: "44px 40px",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  // blobs
  blob1: {
    position: "absolute", top: -80, right: -80,
    width: 260, height: 260, borderRadius: "50%",
    background: "rgba(249, 115, 22, 0.12)", // orange-500 avec transparence
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: -60, left: -40,
    width: 180, height: 180, borderRadius: "50%",
    background: "rgba(249, 115, 22, 0.08)", // orange-500 avec transparence
    pointerEvents: "none",
  },
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      <div style={{
        background: "rgb(30, 58, 138)", borderRadius: 6, width: 30, height: 30, // blue-900
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, color: "#fff",
      }}>
        U
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: "rgb(30, 58, 138)" }}>UniPath</span>
    </div>
  );
}

function ProgressBar({ step }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {[1, 2].map((s) => (
        <div key={s} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: s <= step ? "rgb(249, 115, 22)" : "#e5e7eb", // orange-500
          transition: "background 0.4s",
        }} />
      ))}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
      <label style={{ fontSize: 12, color: "#6b7280" }}>
        {label} {required && <span style={{ color: "rgb(249, 115, 22)" }}>*</span>} {/* orange-500 */}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#111827",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
};

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, borderColor: focused ? "rgb(249, 115, 22)" : "#d1d5db", ...style }} // orange-500
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Select({ value, onChange, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, borderColor: focused ? "rgb(249, 115, 22)" : "#d1d5db", background: "#fff", cursor: "pointer" }} // orange-500
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function BtnPrimary({ children, onClick, style, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 16px",
        background: disabled ? "#9ca3af" : (hovered ? "rgb(234, 88, 12)" : "rgb(249, 115, 22)"), // orange-600 : orange-500
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "background 0.2s",
        ...style,
      }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 20px",
        background: "transparent",
        color: "rgb(249, 115, 22)", // orange-500
        border: "1px solid rgb(249, 115, 22)", // orange-500
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.2s",
        flexShrink: 0,
        backgroundColor: hovered ? "rgba(249, 115, 22, 0.06)" : "transparent", // orange-500 avec transparence
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function FormLeft({ onSuccess, isMobile }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nom: "", 
    prenom: "", 
    telephone: "",
    dateNaiss: "", 
    lieuNaiss: "",
    email: "", 
    password: "", 
    confirmPassword: "",
    role: "",
  });

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError(''); // Clear error when user types
  };

  const handleStep1 = () => {
    // Validation étape 1
    if (!form.nom || !form.prenom || !form.telephone || !form.dateNaiss || !form.lieuNaiss) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    // Validation étape 2
    if (!form.email || !form.password || !form.confirmPassword || !form.role) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // Préparer les données selon le rôle
      let userData = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        dateNaiss: form.dateNaiss,
        lieuNaiss: form.lieuNaiss,
        email: form.email,
        password: form.password,
      };

      // Utiliser l'endpoint approprié selon le rôle
      let result;
      if (form.role === 'COMMISSION') {
        result = await authService.registerCommission(userData);
      } else if (form.role === 'DGES') {
        result = await authService.registerDGES(userData);
      } else {
        result = await authService.register(userData);
      }

      // Si Supabase demande une confirmation email
      if (result?.emailConfirmationRequired) {
        navigate('/login', {
          state: {
            message: '📧 Un email de confirmation a été envoyé à ' + form.email + '. Vérifiez votre boîte mail avant de vous connecter.',
            type: 'warning',
            email: form.email
          }
        });
        return;
      }
      
      // Redirection vers login avec message de succès
      navigate('/login', { 
        state: { 
          message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
          email: form.email 
        } 
      });
      
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.left, padding: isMobile ? "32px 24px" : "44px 48px" }}>
      <Logo />
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Créer un compte
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
        {step === 1 ? "Étape 1/2 — Informations personnelles" : "Étape 2/2 — Compte & rôle"}
      </p>
      
      <ProgressBar step={step} />

      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "12px 16px",
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 16,
        }}>
          ❌ {error}
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <Field label="Nom" required>
              <Input 
                value={form.nom} 
                onChange={set("nom")} 
                placeholder="DEDJI" 
              />
            </Field>
            <Field label="Prénom" required>
              <Input 
                value={form.prenom} 
                onChange={set("prenom")} 
                placeholder="Harry" 
              />
            </Field>
          </div>
          
          <div style={{ marginBottom: 14 }}>
            <Field label="Téléphone" required>
              <Input 
                value={form.telephone} 
                onChange={set("telephone")} 
                placeholder="+229 01 XX XX XX XX" 
                type="tel" 
              />
            </Field>
          </div>
          
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <Field label="Date de naissance" required>
              <Input 
                value={form.dateNaiss} 
                onChange={set("dateNaiss")} 
                type="date" 
              />
            </Field>
            <Field label="Lieu de naissance" required>
              <Input 
                value={form.lieuNaiss} 
                onChange={set("lieuNaiss")} 
                placeholder="Cotonou" 
              />
            </Field>
          </div>
          
          <BtnPrimary style={{ width: "100%" }} onClick={handleStep1}>
            Suivant →
          </BtnPrimary>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Field label="Email" required>
              <Input 
                value={form.email} 
                onChange={set("email")} 
                type="email" 
                placeholder="harry@etudiant.bj" 
              />
            </Field>
          </div>
          
          <div style={{ marginBottom: 14 }}>
            <Field label="Mot de passe" required>
              <Input 
                value={form.password} 
                onChange={set("password")} 
                type="password" 
                placeholder="••••••••" 
              />
            </Field>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field label="Confirmer le mot de passe" required>
              <Input 
                value={form.confirmPassword} 
                onChange={set("confirmPassword")} 
                type="password" 
                placeholder="••••••••" 
              />
            </Field>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <Field label="Profil" required>
              <Select value={form.role} onChange={set("role")}>
                <option value="" disabled>Sélectionner votre rôle</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
            </Field>
          </div>
          
          <div style={{ display: "flex", gap: 10 }}>
            <BtnSecondary onClick={() => setStep(1)}>
              ← Retour
            </BtnSecondary>
            <BtnPrimary 
              style={{ flex: 1 }} 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer mon compte →'}
            </BtnPrimary>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 18 }}>
        Déjà inscrit ?{" "}
        <a 
          href="/login" 
          style={{ color: "rgb(249, 115, 22)", textDecoration: "none", fontWeight: 600 }} // orange-500
        >
          Se connecter
        </a>
        {" · "}
        <a
          href="/"
          style={{ color: "rgb(249, 115, 22)", textDecoration: "none", fontWeight: 600 }}
        >
          Retour à l'accueil
        </a>
      </p>
    </div>
  );
}

// ── RIGHT PANEL ───────────────────────────────────────────────────────────────
function StepItem({ num, name, sub, lit, isLast }) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "flex-start", 
      gap: 14, 
      paddingBottom: isLast ? 0 : 0, 
      position: "relative" 
    }}>
      {!isLast && (
        <div style={{
          position: "absolute", left: 14, top: 30, width: 1,
          height: 28, background: "rgba(255,255,255,0.12)",
        }} />
      )}
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        border: lit ? "none" : "1.5px solid rgba(255,255,255,0.2)",
        background: lit ? "rgb(249, 115, 22)" : "transparent", // orange-500
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600,
        color: lit ? "#fff" : "rgba(255,255,255,0.35)",
        transition: "all 0.4s",
      }}>
        {num}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: lit ? "#fff" : "rgba(255,255,255,0.35)",
          transition: "color 0.4s",
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 12, marginTop: 2,
          color: lit ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
          transition: "color 0.4s",
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function RightPanelContent({ isMobile }) {
  const [activeModule, setActiveModule] = useState(0);
  const [litStep, setLitStep] = useState(0);
  const stepTimerRef = useRef(null);
  const autoTimerRef = useRef(null);

  const runStepAnim = () => {
    clearInterval(stepTimerRef.current);
    setLitStep(0);
    let s = 0;
    stepTimerRef.current = setInterval(() => {
      s++;
      if (s > 4) { 
        clearInterval(stepTimerRef.current); 
        return; 
      }
      setLitStep(s);
    }, 700);
  };

  const switchModule = (idx) => {
    clearInterval(autoTimerRef.current);
    setActiveModule(idx);
    runStepAnim();
    autoTimerRef.current = setInterval(() => {
      setActiveModule((prev) => {
        const next = prev === 0 ? 1 : 0;
        return next;
      });
    }, 6000);
  };

  // auto-switch triggers step anim
  useEffect(() => {
    runStepAnim();
  }, [activeModule]);

  useEffect(() => {
    runStepAnim();
    autoTimerRef.current = setInterval(() => {
      setActiveModule((prev) => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => {
      clearInterval(stepTimerRef.current);
      clearInterval(autoTimerRef.current);
    };
  }, []);

  const mod = MODULES[activeModule];

  return (
    <div style={{
      ...S.right,
      width: isMobile ? "100%" : "46%",
      padding: isMobile ? "32px 24px" : "44px 40px",
      flexDirection: "column",
      display: "flex",
    }}>
      <div style={S.blob1} />
      <div style={S.blob2} />
      
      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 28, 
        position: "relative", 
        zIndex: 1 
      }}>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => switchModule(m.id)}
            style={{
              fontSize: 11, 
              padding: "5px 12px", 
              borderRadius: 100,
              border: `1px solid ${activeModule === m.id ? "rgb(249, 115, 22)" : "rgba(255,255,255,0.2)"}`, // orange-500
              background: activeModule === m.id ? "rgb(249, 115, 22)" : "transparent", // orange-500
              color: activeModule === m.id ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer", 
              fontFamily: "inherit",
              transition: "all 0.25s",
            }}
          >
            {m.tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ 
          fontSize: 11, 
          color: "rgba(255,255,255,0.45)", 
          textTransform: "uppercase", 
          letterSpacing: "0.08em", 
          marginBottom: 10 
        }}>
          {mod.tag}
        </div>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          color: "#fff", 
          lineHeight: 1.3, 
          marginBottom: 8 
        }}>
          {mod.title[0]}
          <br />
          <span style={{ color: "rgb(249, 115, 22)" }}>{mod.title[1]}</span> {/* orange-500 */}
        </div>
        <div style={{ 
          fontSize: 13, 
          color: "rgba(255,255,255,0.5)", 
          lineHeight: 1.7, 
          marginBottom: 28 
        }}>
          {mod.desc}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mod.steps.map((s, i) => (
            <StepItem
              key={i}
              num={i + 1}
              name={s.name}
              sub={s.sub}
              lit={litStep > i}
              isLast={i === mod.steps.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ 
        display: "flex", 
        gap: 6, 
        marginTop: 28, 
        position: "relative", 
        zIndex: 1 
      }}>
        {MODULES.map((m) => (
          <div
            key={m.id}
            onClick={() => switchModule(m.id)}
            style={{
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              cursor: "pointer",
              background: activeModule === m.id ? "rgb(249, 115, 22)" : "rgba(255,255,255,0.2)", // orange-500
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function Register() {
  const isMobile = useIsMobile();

  return (
    <div style={S.page}>
      <div style={S.backgroundImage} />
      <div style={S.backgroundOverlay} />
      
      <div style={{
        ...S.wrap,
        flexDirection: isMobile ? "column" : "row",
        maxWidth: isMobile ? 480 : 940,
        minHeight: "auto",
      }}>
        <FormLeft isMobile={isMobile} onSuccess={() => {}} />
        <RightPanelContent isMobile={isMobile} />
      </div>
    </div>
  );
}