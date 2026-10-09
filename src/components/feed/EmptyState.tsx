import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="feed-state" role="status">
      {icon}
      <strong>{title}</strong>
      <span>{description}</span>
      {actionLabel && onAction && (
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
