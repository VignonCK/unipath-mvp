import { useEffect, useState } from 'react';
import { getUser } from '../../utils/auth';
import { adminInscriptionService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ValidationQuittances() {
  const user = getUser();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejeterModal, setRejeterModal] = useState({ open: false, id: null, motif: '' });

  const charger = () => {
    if (!user?.etablissementId) return;
    setLoading(true);
    adminInscriptionService
      .getQuittancesSoumises(user.etablissementId)
      .then((data) => setInscriptions(data.inscriptions || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
  }, [user?.etablissementId]);

  const retirerDeLaListe = (id) => {
    setInscriptions((prev) => prev.filter((i) => i.id !== id));
  };

  const valider = async (id) => {
    setError('');
    setSuccess('');
    setBusyId(id);
    try {
      const data = await adminInscriptionService.validerQuittance(id);
      retirerDeLaListe(id);
      const matricule = data.inscription?.matricule;
      setSuccess(
        matricule
          ? `Inscription validée. Matricule attribué : ${matricule}`
          : (data.message || 'Inscription validée'),
      );
    } catch (err) {
      setError(err.message || 'Validation impossible');
    } finally {
      setBusyId(null);
    }
  };

  const confirmerRejet = async () => {
    if (!rejeterModal.id || !rejeterModal.motif.trim()) return;
    setError('');
    setSuccess('');
    setBusyId(rejeterModal.id);
    try {
      await adminInscriptionService.rejeterQuittance(rejeterModal.id, rejeterModal.motif.trim());
      retirerDeLaListe(rejeterModal.id);
      setSuccess('Quittance rejetée. Le candidat a été notifié.');
      setRejeterModal({ open: false, id: null, motif: '' });
    } catch (err) {
      setError(err.message || 'Rejet impossible');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Validation des quittances</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vérifiez les quittances bancaires soumises par les candidats et attribuez le matricule étudiant.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : inscriptions.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">
            Aucune quittance en attente de validation.
          </BentoCard>
        ) : (
          <div className="space-y-4">
            {inscriptions.map((ins) => (
              <BentoCard key={ins.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {ins.candidat?.prenom} {ins.candidat?.nom}
                    </p>
                    <p className="text-sm text-gray-600">{ins.filiere?.nom} — {ins.anneeAcademique}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Soumise le {formatDate(ins.quittanceSoumiseLe)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ins.quittanceBancaire && (
                      <a
                        href={ins.quittanceBancaire}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-teal-800 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50"
                      >
                        Voir la quittance
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => valider(ins.id)}
                      disabled={busyId === ins.id}
                      className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      Valider
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejeterModal({ open: true, id: ins.id, motif: '' })}
                      disabled={busyId === ins.id}
                      className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-60"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </BentoCard>
            ))}
          </div>
        )}
      </div>

      {rejeterModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Rejeter la quittance</h3>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejeterModal.motif}
                onChange={(e) => setRejeterModal((m) => ({ ...m, motif: e.target.value }))}
                rows={4}
                placeholder="Indiquez pourquoi la quittance n'est pas acceptée…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setRejeterModal({ open: false, id: null, motif: '' })}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerRejet}
                disabled={!rejeterModal.motif.trim() || busyId === rejeterModal.id}
                className="text-sm bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminEtablissementLayout>
  );
}
