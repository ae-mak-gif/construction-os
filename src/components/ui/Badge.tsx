import React from 'react';

type Variant = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'orange' | 'purple' | 'teal';

const styles: Record<Variant, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function HealthBadge({ health }: { health: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    'on-track': { variant: 'green', label: 'On Track' },
    'at-risk': { variant: 'amber', label: 'At Risk' },
    delayed: { variant: 'red', label: 'Delayed' },
    completed: { variant: 'blue', label: 'Completed' },
  };
  const cfg = map[health] || { variant: 'gray', label: health };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    Active: 'green',
    Inactive: 'gray',
    Prospect: 'blue',
    'On Leave': 'amber',
    Suspended: 'red',
    Paid: 'green',
    Outstanding: 'blue',
    Overdue: 'red',
    Partial: 'amber',
    Open: 'red',
    Mitigated: 'amber',
    Closed: 'gray',
    Resolved: 'green',
    'In Progress': 'blue',
    Pending: 'amber',
    Completed: 'green',
    Requested: 'gray',
    Approved: 'blue',
    'PO Issued': 'teal',
    Delivered: 'green',
    Rejected: 'red',
    Available: 'green',
    'In Use': 'blue',
    'Under Maintenance': 'amber',
    Excellent: 'green',
    Good: 'blue',
    Fair: 'amber',
    'Needs Repair': 'red',
    'To Do': 'gray',
    Review: 'purple',
    Done: 'green',
    High: 'red',
    Medium: 'amber',
    Low: 'green',
    New: 'blue',
    Contacted: 'teal',
    Qualified: 'purple',
    Quoted: 'orange',
    Won: 'green',
    Lost: 'red',
    Planning: 'amber',
  };
  return <Badge variant={map[status] || 'gray'}>{status}</Badge>;
}
