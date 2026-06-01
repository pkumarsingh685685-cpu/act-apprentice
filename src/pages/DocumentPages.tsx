import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { DocumentPanel } from '../components/DocumentPanel';

export function Notifications() {
  const items = useStore((state) => state.notifications);
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <DocumentPanel title={t('nav_apprentice_notification')} items={items} theme="blue" />
    </div>
  );
}

export function Merit() {
  const items = useStore((state) => state.meritPanels);
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <DocumentPanel title={t('nav_merit_panel')} items={items} theme="blue" />
    </div>
  );
}

export function Results() {
  const items = useStore((state) => state.results);
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <DocumentPanel title={t('nav_results')} items={items} theme="blue" />
    </div>
  );
}

export function DARCirculars() {
  const items = useStore((state) => state.darCirculars);
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <DocumentPanel title={t('nav_dar_circulars')} items={items} theme="blue" />
    </div>
  );
}

export function ActCirculars() {
  const items = useStore((state) => state.actCirculars);
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <DocumentPanel title={t('nav_act_circulars')} items={items} theme="blue" />
    </div>
  );
}
