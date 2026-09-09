import type { PublicLifecycleStatus } from "@/lib/publicLifecycle";

export default function PublicStatusBadge({
  status,
}: {
  status: PublicLifecycleStatus | null;
}) {
  if (!status) return null;

  return (
    <>
      <span className={`os-public-status os-public-status-${status.tone}`}>
        {status.label}
      </span>

      <style jsx>{`
        .os-public-status {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          padding: 2px 7px;
          border: 1px solid transparent;
          border-radius: 999px;
          font-size: 10.5px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .os-public-status-success {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .os-public-status-warning {
          border-color: #fed7aa;
          background: #fff7ed;
          color: #c2410c;
        }

        .os-public-status-danger {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .os-public-status-info {
          border-color: #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .os-public-status-neutral {
          border-color: #e2e8f0;
          background: #f8fafc;
          color: #475569;
        }
      `}</style>
    </>
  );
}
