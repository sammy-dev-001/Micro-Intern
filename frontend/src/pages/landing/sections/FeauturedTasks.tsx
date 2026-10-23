import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "../../../components/Container";
import { SectionHeading } from "../../../components/SectionHeading";
import { Skeleton } from "../../../components/Skeleton";
import { useReveal } from "../../../lib/useReveal";
import { api } from "../../../lib/api";
import { formatNaira } from "../../../lib/format";

/**
 * Shape returned by GET /api/v2/projects.
 * The projects table has: id, business_id, title, description, budget,
 * duration_days, status, created_at. The route joins business_name,
 * company_name, industry, and computes applicant_count.
 */
type Task = {
  id: string;
  title: string;
  description: string;
  budget: number; // ← was budget_kobo
  duration_days: number;
  status: string;
  created_at: string;
  business_name: string;
  company_name: string | null;
  industry: string | null;
  applicant_count: number;
};

export function FeaturedTasks() {
  const revealRef = useReveal<HTMLElement>();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Task[]>("/projects")
      .then((rows) => {
        if (cancelled) return;
        setTasks(rows.slice(0, 3));
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={revealRef}
      data-reveal
      aria-labelledby="featured-tasks-heading"
      className="section"
    >
      <Container>
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Live now"
            title={
              <span id="featured-tasks-heading">
                Open tasks, funded and waiting
              </span>
            }
            subline="Real briefs from real businesses. Every budget is paid from escrow, not promised."
          />
          <Link
            to="/tasks"
            className="shrink-0 text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            Browse all tasks →
          </Link>
        </div>

        {error && (
          <p className="rounded-md border border-chalk bg-paper p-4 text-sm text-ink/70">
            Couldn't load tasks right now. Refresh to try again.
          </p>
        )}

        {!error && tasks === null && (
          <ul
            className="grid gap-5 md:grid-cols-3"
            aria-busy="true"
            aria-live="polite"
          >
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <TaskCardSkeleton />
              </li>
            ))}
          </ul>
        )}

        {!error && tasks && tasks.length === 0 && (
          <p className="rounded-md border border-chalk bg-paper p-4 text-sm text-ink/70">
            No tasks are open right now. Check back soon — new briefs land most
            weeks.
          </p>
        )}

        {!error && tasks && tasks.length > 0 && (
          <ul className="grid gap-5 md:grid-cols-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  const business = task.company_name ?? task.business_name;
  const postedAgo = relativeDays(task.created_at);

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group flex h-full min-h-[280px] flex-col gap-4 rounded-lg border border-chalk bg-paper p-6 transition-colors hover:border-brand/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-utility font-bold text-brand/70">
          {task.industry ?? "Open task"}
        </span>
        <span className="label-utility text-ink/50">Open</span>
      </div>

      <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-ink group-hover:text-brand">
        {task.title}
      </h3>

      <p className="line-clamp-3 text-sm leading-relaxed text-ink/80">
        {task.description}
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="tabular text-xl font-extrabold text-ink">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(task.budget)}
          </span>
          <span className="text-xs text-ink/75">{task.duration_days} days</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-chalk pt-3 text-xs font-bold text-ink/60">
          <span className="truncate">{business}</span>
          <span className="shrink-0">
            {task.applicant_count} applicant
            {task.applicant_count === 1 ? "" : "s"} · {postedAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TaskCardSkeleton() {
  return (
    <div className="flex h-full min-h-[280px] flex-col gap-4 rounded-lg border border-chalk bg-paper p-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-chalk pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

function relativeDays(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}
