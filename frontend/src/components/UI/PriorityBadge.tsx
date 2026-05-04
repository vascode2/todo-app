import { Priority } from '../../types';

const config: Record<Priority, { label: string; className: string }> = {
  LOW:    { label: 'Low',    className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  HIGH:   { label: 'High',   className: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority];
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${className}`}>{label}</span>
  );
}
