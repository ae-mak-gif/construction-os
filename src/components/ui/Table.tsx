import React from 'react';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-gray-50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}
