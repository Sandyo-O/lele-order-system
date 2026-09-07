"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionResult } from "./actions";

export function SavableForm({
  action,
  className,
  children,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!state) return;
    // Auto-dismiss the result badge a couple seconds after each submission.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowResult(true);
    const timer = setTimeout(() => setShowResult(false), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <form action={formAction} className={className}>
      {children}
      {showResult && state && (
        <span
          className={`ml-2 text-xs font-medium ${state.ok ? "text-green-600" : "text-red-600"}`}
        >
          {state.ok ? "✅" : "⚠️"} {state.message}
        </span>
      )}
      {pending && <span className="ml-2 text-xs text-neutral-400">儲存中...</span>}
    </form>
  );
}
