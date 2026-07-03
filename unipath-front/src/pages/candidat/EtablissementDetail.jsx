import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { candidatService, etablissementService, resolvePublicAssetUrl } from '../../services/api';
import { handleSessionError } from '../../utils/auth';
import CandidatLayout from '../../components/CandidatLayout';
import EcolesPriveesNav from '../../components/EcolesPriveesNav';
import { ROUTES } from '../../constants/routes';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFcfa(value) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('fr-FR')} FCFA`;
}

function formatTaux(value) {
  if (value == null) return '—';
  return `${Math.round(Number(value) * 100)} %`;
}

function InfoRow({ label, value, href }) {
  if (!value) return null;
  return (
    <p className="text-sm text-gray-600">
      <span className="font-semibold text-gray-800">{label} :</span>{' '}
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-blue-900 hover:underline break-all">
          {value}
        </a>
      ) : (
        value
      )}
    </p>
  );
}

function FiliereCard({ filiere }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
      <div>
        <h3 className="font-bold text-gray-900">{filiere.nom}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {filiere.niveau || '—'} · {filiere.dureeAnnees ?? '—'} an{filiere.dureeAnnees > 1 ? 's' : ''}
          {filiere.code ? ` · ${filiere.code}` : ''}
        </p>
      </div>
      <div className="grid gap-1 sm:grid-cols-2 text-sm text-gray-600">
        <p><span className="font-medium text-gray-800">Langue :</span> {filiere.langueEnseignement || '—'}</p>
        <p><span className="font-medium text-gray-800">Scolarité annuelle :</span> {formatFcfa(filiere.fraisScolariteAnnuels)}</p>
        <p><span className="font-medium text-gray-800">Inscription effective :</span> {formatFcfa(filiere.fraisInscriptionEffective)}</p>
        <p><span className="font-medium text-gray-800">Taux de réussite :</span> {formatTaux(filiere.tauxReussite)}</p>
        <p className="sm:col-span-2"><span className="font-medium text-gray-800">Stage :</span> {filiere.dureeStage || '—'}</p>
      </div>
      {filiere.fraisAutres && (
        <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Autres frais :</span> {filiere.fraisAutres}</p>
      )}
      {filiere.debouches && (
        <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Débouchés :</span> {filiere.debouches}</p>
      )}
      {filiere.partenariatsEntreprises && (
        <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Partenariats entreprises :</span> {filiere.partenariatsEntreprises}</p>
      )}
      {filiere.partenariatsUniversites && (
        <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Partenariats universités :</span> {filiere.partenariatsUniversites}</p>
      )}
    </div>
  );
}

export default function EtablissementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [etablissement, setEtablissement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [profil, data] = await Promise.all([
          candidatService.getProfil(),
          etablissementService.getById(id),
        ]);
        setCandidat(profil);
        setEtablissement(data.etablissement || null);
      } catch (err) {
        if (handleSessionError(err, navigate)) return;
        setError(err?.message || 'Erreur de chargement');
        setEtablissement(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const logoSrc = useMemo(
    () => resolvePublicAssetUrl(etablissement?.logoUrl),
    [etablissement?.logoUrl],
  );

  const campagnesActives = useMemo(() => etablissement?.campagnes || [], [etablissement]);

  const postuler = (campagne, cf) => {
    navigate(ROUTES.parcours.dossiers, {
      state: {
        etablissementId: etablissement.id,
        filiereId: cf.filiereId || cf.filiere?.id,
        anneeAcademique: campagne.anneeAcademique,
        niveau: '1',
        campagneFiliereId: cf.id,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!etablissement) {
    return (
      <CandidatLayout candidat={candidat}>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600">{error || 'Établissement introuvable'}</p>
          <Link to={ROUTES.parcours.etablissements} className="inline-block mt-4 text-sm text-blue-900 hover:underline">
            ← Retour aux écoles privées
          </Link>
        </div>
      </CandidatLayout>
    );
  }

  const reseaux = [
    { label: 'Facebook', url: etablissement.facebook },
    { label: 'Instagram', url: etablissement.instagram },
    { label: 'LinkedIn', url: etablissement.linkedin },
  ].filter((r) => r.url);

  return (
    <CandidatLayout candidat={candidat}>
      <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-0 py-2">
        <div>
          <Link to={ROUTES.parcours.etablissements} className="text-sm text-blue-900 hover:underline mb-4 inline-block">
            ← Écoles privées
          </Link>
          <EcolesPriveesNav />
        </div>

        <BentoCard className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`Logo ${etablissement.nom}`}
                className="h-24 w-24 rounded-xl border border-gray-200 bg-white object-contain p-2 shrink-0"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 shrink-0">
                Pas de logo
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">{etablissement.nom}</h1>
              <p className="text-gray-600">
                {etablissement.ville}
                {etablissement.adresse ? ` — ${etablissement.adresse}` : ''}
              </p>
              <div className="grid gap-1 pt-2">
                <InfoRow label="Téléphone" value={etablissement.telephone} href={etablissement.telephone ? `tel:${etablissement.telephone}` : undefined} />
                <InfoRow label="Email" value={etablissement.email} href={etablissement.email ? `mailto:${etablissement.email}` : undefined} />
                <InfoRow label="Site web" value={etablissement.siteWeb} href={etablissement.siteWeb || undefined} />
                <InfoRow label="Année de création" value={etablissement.anneeCreation ? String(etablissement.anneeCreation) : null} />
                <InfoRow label="Agrément MESRS" value={etablissement.agrementMESRS} />
              </div>
            </div>
          </div>
        </BentoCard>

        {etablissement.description && (
          <BentoCard className="p-6">
            <h2 className="font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">{etablissement.description}</p>
          </BentoCard>
        )}

        {reseaux.length > 0 && (
          <BentoCard className="p-6">
            <h2 className="font-bold text-gray-900 mb-3">Réseaux sociaux</h2>
            <div className="flex flex-wrap gap-3">
              {reseaux.map((r) => (
                <a
                  key={r.label}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition"
                >
                  {r.label}
                </a>
              ))}
            </div>
          </BentoCard>
        )}

        <BentoCard className="p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Filières</h2>
          {(etablissement.filieres || []).length === 0 ? (
            <p className="text-sm text-gray-500">Aucune filière renseignée pour cet établissement.</p>
          ) : (
            <div className="grid gap-4">
              {etablissement.filieres.map((filiere) => (
                <FiliereCard key={filiere.id} filiere={filiere} />
              ))}
            </div>
          )}
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Campagnes d&apos;inscription ouvertes</h2>
          </div>
          {campagnesActives.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Aucune campagne ouverte pour le moment. Vous pouvez tout de même déposer un dossier depuis{' '}
              <Link to={ROUTES.parcours.dossiers} state={{ etablissementId: etablissement.id }} className="text-blue-900 hover:underline">
                la page de candidature
              </Link>
              .
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {campagnesActives.map((campagne) => (
                <div key={campagne.id} className="px-6 py-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{campagne.titre}</h3>
                    <p className="text-sm text-gray-500 mt-1">{campagne.anneeAcademique}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Du {formatDate(campagne.dateOuverture)} au {formatDate(campagne.dateCloture)}
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Filière</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Frais dossier</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Places</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Séries</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(campagne.filieres || []).map((cf) => (
                          <tr key={cf.id}>
                            <td className="px-4 py-3 font-medium">{cf.filiere?.nom || '—'}</td>
                            <td className="px-4 py-3">{formatFcfa(cf.fraisDossier)}</td>
                            <td className="px-4 py-3">{cf.placesDisponibles ?? '—'}</td>
                            <td className="px-4 py-3">{(cf.seriesAcceptees || []).join(', ') || 'Toutes'}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => postuler(campagne, cf)}
                                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 whitespace-nowrap"
                              >
                                Postuler
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      </div>
    </CandidatLayout>
  );
}
