import React from 'react';
import { LucideIcon, FileQuestion, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-xs max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>

      {(actionText && (actionHref || onAction)) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-semibold text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-semibold text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
