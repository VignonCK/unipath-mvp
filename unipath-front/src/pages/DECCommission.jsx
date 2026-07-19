import { useCallback, useEffect, useState } from 'react';
import { concoursService, dgesService } from '../services/api';
import DECLayout from '../components/DECLayout';
import { BentoCard } from '../components/AcademicLayout';

const FORM_INIT = { nom: '', prenom: '', email: '', telephone: '' };
const LIMITES = { EXAMINATEUR: 10, CONTROLEUR: 5 };

function roleLabel(sousRole) {
  if (sousRole === 'EXAMINATEUR') return 'Examinateur';
  if (sousRole === 'CONTROLEUR') return 'Contrôleur';
  return sousRole || '—';
}

export default function DECCommission() {
  const [concoursList, setConcoursList] = useState([]);
  const [concoursId, setConcoursId] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [etudeBusy, setEtudeBusy] = useState(false);

  // Bloc 2 — assignés + modal
  const [desassigningId, setDesassigningId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [assignMembreId, setAssignMembreId] = useState('');
  const [assignSousRole, setAssignSousRole] = useState('EXAMINATEUR');
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Bloc 3 — créer un compte (pool)
  const [createForm, setCreateForm] = useState(FORM_INIT);
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    setLoadingList(true);
    concoursService.getAll()
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setConcoursList(rows);
        if (rows.length === 1) setConcoursId(rows[0].id);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les concours'))
      .finally(() => setLoadingList(false));
  }, []);

  const charger = useCallback(async () => {
    if (!concoursId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await dgesService.getCommissionConcours(concoursId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [concoursId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const openAssignModal = async () => {
    setModalOpen(true);
    setAssignError('');
    setAssignMembreId('');
    setAssignSousRole('EXAMINATEUR');
    setPoolLoading(true);
    try {
      const res = await dgesService.listerComptesCommission(true);
      setPool(Array.isArray(res?.comptes) ? res.comptes : []);
    } catch (err) {
      setAssignError(err.message || 'Impossible de charger le pool');
      setPool([]);
    } finally {
      setPoolLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!concoursId || !assignMembreId) return;
    setAssignBusy(true);
    setAssignError('');
    try {
      await dgesService.assignerMembreCommission(concoursId, {
        membreId: assignMembreId,
        sousRole: assignSousRole,
      });
      setModalOpen(false);
      await charger();
    } catch (err) {
      setAssignError(err.message || 'Assignation impossible');
    } finally {
      setAssignBusy(false);
    }
  };

  const handleDesassigner = async (membreId) => {
    if (!window.confirm(
      'Désassigner ce membre de ce concours ? Le compte restera disponible dans le pool.',
    )) return;
    setDesassigningId(membreId);
    setError('');
    try {
      await dgesService.desassignerMembreCommission(concoursId, membreId);
      await charger();
    } catch (err) {
      setError(err.message || 'Erreur lors de la désassignation');
    } finally {
      setDesassigningId('');
    }
  };

  const handleCreateCompte = async (e) => {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError('');
    setCreateMessage('');
    try {
      const res = await dgesService.creerCompteCommission(createForm);
      setCreateMessage(res.message || 'Compte créé (non assigné)');
      setCreateForm(FORM_INIT);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleToggleEtude = async () => {
    const c = data?.concours;
    if (!c) return;
    const cloture = Boolean(c.etudeCloturee);
    const ouvrirLabel = c.etudeDejaOuverte ? 'Rouvrir' : 'Ouvrir';

    if (cloture) {
      if (!data?.peutOuvrirEtude) {
        const labels = (data?.manquants || []).map((m) => (
          m === 'EXAMINATEUR' ? 'examinateur' : 'contrôleur'
        ));
        setError(
          `Commission incomplète (manque ${labels.join(' et ') || 'staff'}). Assignez au moins 1 examinateur et 1 contrôleur avant d'ouvrir l'étude.`,
        );
        return;
      }
      if (!confirm(
        `${ouvrirLabel} l'étude des dossiers pour « ${c.libelle} » ?\nLes examinateurs et contrôleurs pourront modifier les dossiers.`,
      )) {
        return;
      }
    } else if (!confirm(
      `Clôturer l'étude des dossiers pour « ${c.libelle} » ?\nPlus aucune modification (verdicts / décisions) ne sera possible tant que l'étude reste clôturée.`,
    )) {
      return;
    }

    setEtudeBusy(true);
    setError('');
    try {
      await (cloture
        ? dgesService.rouvrirEtudeConcours(c.id)
        : dgesService.cloturerEtudeConcours(c.id));
      await charger();
    } catch (err) {
      setError(err.message || 'Action étude impossible');
    } finally {
      setEtudeBusy(false);
    }
  };

  const concours = data?.concours;
  const peutOuvrir = Boolean(data?.peutOuvrirEtude);
  const ouvrirBtnLabel = concours?.etudeDejaOuverte ? 'Rouvrir l\'étude' : 'Ouvrir l\'étude';
  const assignes = Array.isArray(data?.membres) ? data.membres : [];
  const nbExam = data?.nbExaminateurs ?? (data?.examinateurs || []).length;
  const nbCtrl = data?.nbControleurs ?? (data?.controleurs || []).length;
  const canAssignMore = nbExam < LIMITES.EXAMINATEUR || nbCtrl < LIMITES.CONTROLEUR;

  return (
    <DECLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Commission</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comptes commission, assignation par concours, ouverture / clôture de l&apos;étude
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="filter-concours-commission">
            Choisir un concours
          </label>
          <select
            id="filter-concours-commission"
            value={concoursId}
            onChange={(e) => {
              setConcoursId(e.target.value);
              setCreateMessage('');
              setCreateError('');
            }}
            disabled={loadingList}
            className="w-full sm:max-w-lg rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {concoursList.map((c) => (
              <option key={c.id} value={c.id}>{c.libelle}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!concoursId && !loadingList && (
          <p className="text-sm text-gray-500">Sélectionnez un concours pour gérer sa commission.</p>
        )}

        {loading && concoursId && <p className="text-gray-500 text-sm">Chargement…</p>}

        {!loading && concours && (
          <>
            {/* Bloc 1 — état étude */}
            <BentoCard className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{concours.libelle}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Étude :{' '}
                    {concours.etudeCloturee ? (
                      <span className="font-semibold text-red-700">
                        {concours.etudeDejaOuverte ? 'Clôturée' : 'Verrouillée (pas encore ouverte)'}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-700">Ouverte</span>
                    )}
                  </p>
                  {concours.etudeCloturee && !peutOuvrir && (
                    <p className="text-xs text-amber-700 mt-2">
                      Assignez au moins 1 examinateur et 1 contrôleur pour pouvoir ouvrir l&apos;étude
                      {(data?.manquants || []).length > 0
                        ? ` (manque : ${(data.manquants || []).map((m) => (
                          m === 'EXAMINATEUR' ? 'examinateur' : 'contrôleur'
                        )).join(', ')})`
                        : ''}
                      .
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleToggleEtude}
                  disabled={etudeBusy || (concours.etudeCloturee && !peutOuvrir)}
                  title={
                    concours.etudeCloturee && !peutOuvrir
                      ? 'Commission incomplète'
                      : undefined
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    concours.etudeCloturee
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {etudeBusy
                    ? '…'
                    : (concours.etudeCloturee ? ouvrirBtnLabel : 'Clôturer l\'étude')}
                </button>
              </div>
            </BentoCard>

            {/* Bloc 2 — assignés à ce concours */}
            <BentoCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Membres assignés</h2>
                  <p className="text-sm text-gray-500">
                    {nbExam} examinateur{nbExam > 1 ? 's' : ''} · {nbCtrl} contrôleur{nbCtrl > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAssignModal}
                  disabled={!canAssignMore}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  Assigner un compte existant
                </button>
              </div>

              {assignes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 px-4 font-semibold">Nom</th>
                        <th className="py-2 px-4 font-semibold">Email</th>
                        <th className="py-2 px-4 font-semibold">Rôle</th>
                        <th className="py-2 px-4 font-semibold">Activité</th>
                        <th className="py-2 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignes.map((m) => {
                        const n = Number(m.nbDossiersExamines) || 0;
                        return (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {m.prenom} {m.nom}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{m.email}</td>
                          <td className="py-3 px-4 text-gray-700">{roleLabel(m.sousRole)}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {n} dossier{n !== 1 ? 's' : ''} examiné{n !== 1 ? 's' : ''}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDesassigner(m.id)}
                              disabled={desassigningId === m.id}
                              className="text-sm text-amber-700 hover:text-amber-900 disabled:opacity-50"
                            >
                              {desassigningId === m.id ? '…' : 'Désassigner'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun membre assigné. Créez un compte ci-dessous, puis assignez-le ici.
                </p>
              )}
            </BentoCard>
          </>
        )}

        {/* Bloc 3 — créer un compte (indépendant du concours sélectionné) */}
        <BentoCard className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Créer un compte</h2>
          <p className="text-sm text-gray-500 mb-4">
            Le compte est ajouté au pool (sans concours). Assignez-le ensuite à un concours.
          </p>

          {createMessage && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {createMessage}
            </div>
          )}
          {createError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateCompte} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Nom"
              value={createForm.nom}
              onChange={(e) => setCreateForm((f) => ({ ...f, nom: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              required
              placeholder="Prénom"
              value={createForm.prenom}
              onChange={(e) => setCreateForm((f) => ({ ...f, prenom: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Téléphone (optionnel)"
              value={createForm.telephone}
              onChange={(e) => setCreateForm((f) => ({ ...f, telephone: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createBusy}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {createBusy ? 'Création…' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </BentoCard>
      </div>

      {/* Modal assignation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Assigner un compte</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choisir un compte du pool et un rôle pour ce concours.
            </p>

            {assignError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {assignError}
              </div>
            )}

            {poolLoading ? (
              <p className="text-sm text-gray-500">Chargement du pool…</p>
            ) : (
              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="assign-membre">
                    Compte
                  </label>
                  <select
                    id="assign-membre"
                    required
                    value={assignMembreId}
                    onChange={(e) => setAssignMembreId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Sélectionner —</option>
                    {pool.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom} ({c.email})
                      </option>
                    ))}
                  </select>
                  {pool.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">
                      Aucun compte disponible. Créez-en un d&apos;abord.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="assign-role">
                    Rôle
                  </label>
                  <select
                    id="assign-role"
                    value={assignSousRole}
                    onChange={(e) => setAssignSousRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="EXAMINATEUR" disabled={nbExam >= LIMITES.EXAMINATEUR}>
                      Examinateur ({nbExam}/{LIMITES.EXAMINATEUR})
                    </option>
                    <option value="CONTROLEUR" disabled={nbCtrl >= LIMITES.CONTROLEUR}>
                      Contrôleur ({nbCtrl}/{LIMITES.CONTROLEUR})
                    </option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={assignBusy || pool.length === 0}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {assignBusy ? '…' : 'Assigner'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DECLayout>
  );
}
