import { useEffect, useState } from 'react';
import { decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

function defaultNextLibelle(annees) {
  if (!annees.length) {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }
  const last = [...annees].sort((a, b) => b.libelle.localeCompare(a.libelle))[0];
  const start = Number(String(last.libelle).split('-')[0]);
  if (!Number.isFinite(start)) {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }
  return `${start + 1}-${start + 2}`;
}

export default function DECAnneesAcademiques() {
  const [annees, setAnnees] = useState([]);
  const [anneeEnCours, setAnneeEnCours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [libelle, setLibelle] = useState('');
  const [definirEnCours, setDefinirEnCours] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settingId, setSettingId] = useState(null);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await decService.listerAnneesAcademiques();
      const list = data.annees || [];
      setAnnees(list);
      setAnneeEnCours(data.anneeEnCours || list.find((a) => a.enCours) || null);
      setLibelle((prev) => prev || defaultNextLibelle(list));
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.creerAnneeAcademique({
        libelle: libelle.trim(),
        definirEnCours,
      });
      setMessage(res.message || 'Année créée');
      setDefinirEnCours(false);
      await charger();
      setLibelle(defaultNextLibelle([...(annees), res.annee].filter(Boolean)));
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleDefinirEnCours = async (annee) => {
    if (annee.enCours) return;
    if (!window.confirm(`Définir « ${annee.libelle} » comme année académique en cours (Module 1 — concours) ?\nLes autres comptes ne verront que les concours de cette année.`)) {
      return;
    }
    setSettingId(annee.id);
    setError('');
    setMessage('');
    try {
      const res = await decService.definirAnneeEnCours(annee.id);
      setMessage(res.message || 'Année en cours mise à jour');
      await charger();
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setSettingId(null);
    }
  };

  return (
    <DECLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Années académiques</h1>
          <p className="text-gray-500 text-sm mt-1">
            Module 1 — concours. Définissez l&apos;année en cours : les candidats, examinateurs et
            contrôleurs ne voient que les concours de cette année. Indépendante de l&apos;année
            gérée par la DGES pour les établissements privés (Module 2).
          </p>
        </div>

        {anneeEnCours && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Année académique en cours : <strong>{anneeEnCours.libelle}</strong>
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-800">Créer une année académique</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Libellé</label>
              <input
                required
                pattern="\d{4}-\d{4}"
                placeholder="2026-2027"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-1">Format AAAA-AAAA (ex. 2025-2026)</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={definirEnCours}
                onChange={(e) => setDefinirEnCours(e.target.checked)}
              />
              Définir comme année en cours
            </label>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {creating ? 'Création…' : 'Créer'}
            </button>
          </form>
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Concours</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Statut</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {annees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        Aucune année enregistrée.
                      </td>
                    </tr>
                  ) : (
                    annees.map((annee) => (
                      <tr key={annee.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{annee.libelle}</td>
                        <td className="px-6 py-4 text-gray-600">{annee._count?.concours ?? 0}</td>
                        <td className="px-6 py-4">
                          {annee.enCours ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Archive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={annee.enCours || settingId === annee.id}
                            onClick={() => handleDefinirEnCours(annee)}
                            className={`text-sm font-semibold ${
                              annee.enCours
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-orange-600 hover:text-orange-700'
                            }`}
                          >
                            {annee.enCours
                              ? 'Année active'
                              : settingId === annee.id
                                ? '…'
                                : 'Définir en cours'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </DECLayout>
  );
}
