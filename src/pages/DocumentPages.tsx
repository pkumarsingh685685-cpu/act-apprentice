import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { DocumentPanel } from '../components/DocumentPanel';

export function Notifications() {
  const items = useStore((state) => state.notifications);
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      <DocumentPanel title={t('nav_apprentice_notification')} items={items} theme="blue" />
    </div>
  );
}

export function Merit() {
  const items = useStore((state) => state.meritPanels);
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      <DocumentPanel title={t('nav_merit_panel')} items={items} theme="blue" />
    </div>
  );
}

export function Results() {
  const items = useStore((state) => state.results);
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      <DocumentPanel title={t('nav_results')} items={items} theme="blue" />
    </div>
  );
}

export function DARCirculars() {
  const items = useStore((state) => state.darCirculars);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const processedItems = [...(items || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item, index) => ({ ...item, isNew: index < 10 }));

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      <DocumentPanel title={t('nav_dar_circulars')} items={processedItems} theme="blue" />
    </div>
  );
}

export function ActCirculars() {
  const items = useStore((state) => state.actCirculars);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const processedItems = [...(items || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item, index) => ({ ...item, isNew: index < 10 }));

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>
      <DocumentPanel title={t('nav_act_circulars')} items={processedItems} theme="blue" />
    </div>
  );
}
