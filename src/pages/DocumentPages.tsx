import { useStore } from '../store/useStore';
import { DocumentPanel } from '../components/DocumentPanel';

export function Notifications() {
  const items = useStore((state) => state.notifications);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <DocumentPanel title="Apprentice Notifications" items={items} theme="blue" />
    </div>
  );
}

export function Merit() {
  const items = useStore((state) => state.meritPanels);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <DocumentPanel title="Merit Panels" items={items} theme="blue" />
    </div>
  );
}

export function Results() {
  const items = useStore((state) => state.results);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <DocumentPanel title="Results" items={items} theme="blue" />
    </div>
  );
}

export function DARCirculars() {
  const items = useStore((state) => state.darCirculars);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <DocumentPanel title="DAR Circulars" items={items} theme="blue" />
    </div>
  );
}

export function ActCirculars() {
  const items = useStore((state) => state.actCirculars);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <DocumentPanel title="Act Apprentice Circulars" items={items} theme="blue" />
    </div>
  );
}
