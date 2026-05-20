"use client";

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-error/20 bg-error/5 p-8 text-center"
      role="alert"
    >
      <svg
        className="inline-size-12 block-size-12 text-error"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      <div>
        <h3 className="font-semibold text-foreground">
          Failed to load cost data
        </h3>
        <p className="mt-1 text-sm text-muted">{error.message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-[var(--radius-md)] bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-mint-dark focus-visible:outline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
