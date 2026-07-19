import { useCallback, useEffect, useState } from 'react';
import { decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function DECParametresDocuments() {
  const [status, setStatus] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const chargerApercu = useCallback(async () => {
    try {
      const blob = await decService.getEnTetePdfImageBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await decService.getEnTetePdf();
      setStatus(data);
      await chargerApercu();
    } catch (err) {
      setError(err.message || 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  }, [chargerApercu]);

  useEffect(() => {
    charger();
    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [charger]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.uploadEnTetePdf(file);
      setStatus(res);
      setMessage(res.message || 'En-tête mis à jour');
      await chargerApercu();
    } catch (err) {
      setError(err.message || 'Échec de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Restaurer l\'en-tête MESRS par défaut pour tous les prochains PDF ?')) {
      return;
    }
    setRestoring(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.restoreEnTetePdf();
      setStatus(res);
      setMessage(res.message || 'En-tête par défaut restauré');
      await chargerApercu();
    } catch (err) {
      setError(err.message || 'Échec de la restauration');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <DECLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Paramètres des documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez l&apos;en-tête officiel utilisé sur tous les PDF générés (listes, résultats,
            statistiques, convocations, fiches…).
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <BentoCard className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">En-tête des PDF</h2>
              <p className="text-xs text-slate-500 mt-1">
                Format JPG ou PNG · max 5 Mo · bandeau large recommandé (ex. 1024×151 px).
                Le changement s&apos;applique immédiatement aux prochains exports.
              </p>
            </div>
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                status?.isCustom
                  ? 'bg-teal-50 text-teal-800 border border-teal-100'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {status?.isCustom ? 'Personnalisé' : 'Par défaut (MESRS)'}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-9 h-9 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Aperçu de l'en-tête PDF"
                    className="w-full h-auto object-contain max-h-40"
                  />
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">Aucun aperçu disponible</p>
                )}
              </div>

              {(status?.largeur || status?.originalName) && (
                <p className="text-xs text-slate-500">
                  {status.originalName ? `${status.originalName} · ` : ''}
                  {status.largeur && status.hauteur
                    ? `${status.largeur}×${status.hauteur} px`
                    : ''}
                  {status.updatedAt
                    ? ` · mis à jour le ${new Date(status.updatedAt).toLocaleString('fr-FR')}`
                    : ''}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <label className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50">
                  {uploading ? 'Upload…' : 'Remplacer l\'en-tête'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={uploading || restoring}
                    onChange={handleUpload}
                  />
                </label>
                <button
                  type="button"
                  disabled={!status?.isCustom || uploading || restoring}
                  onClick={handleRestore}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                >
                  {restoring ? 'Restauration…' : 'Restaurer le défaut MESRS'}
                </button>
                <button
                  type="button"
                  disabled={loading || uploading || restoring}
                  onClick={charger}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Actualiser
                </button>
              </div>
            </>
          )}
        </BentoCard>
      </div>
    </DECLayout>
  );
}
