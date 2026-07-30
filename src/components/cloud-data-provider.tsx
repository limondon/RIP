"use client";

import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import {
  CRITICAL_OPERATION_FEEDBACK_EVENT,
  type CriticalOperationFeedback,
} from "@/lib/data/critical-operation-feedback";
import { registerCloudRefreshTriggers } from "@/lib/data/cloud-refresh-triggers";
import { CLOUD_MUTATION_EVENT, crmCloudTables, type CrmCloudMutation } from "@/lib/data/cloud-sync-events";
import { applySupabaseMutation, downloadSupabaseSnapshot, enableCloudSync, isCloudSyncEnabled } from "@/lib/data/supabase-repository";
import { importCrmData } from "@/lib/data/repository";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function CloudDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  const [criticalFeedback, setCriticalFeedback] = useState<CriticalOperationFeedback | null>(null);
  const criticalFeedbackTimer = useRef<number>();
  const hydrating = useRef(false);
  const refreshing = useRef(false);
  const authenticated = useRef(false);
  const remoteSignature = useRef("");
  const pendingMutations = useRef(0);

  useEffect(() => {
    const showCriticalFeedback = (event: Event) => {
      const feedback = (event as CustomEvent<CriticalOperationFeedback>).detail;
      if (!feedback?.message) return;
      window.clearTimeout(criticalFeedbackTimer.current);
      setCriticalFeedback(feedback);
      criticalFeedbackTimer.current = window.setTimeout(() => setCriticalFeedback(null), 4000);
    };

    window.addEventListener(CRITICAL_OPERATION_FEEDBACK_EVENT, showCriticalFeedback);
    return () => {
      window.clearTimeout(criticalFeedbackTimer.current);
      window.removeEventListener(CRITICAL_OPERATION_FEEDBACK_EVENT, showCriticalFeedback);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;
    let mutationQueue = Promise.resolve();
    const supabase = getBrowserSupabaseClient();

    const hydrateFromCloud = async (refreshContent = false) => {
      if (!authenticated.current || refreshing.current || pendingMutations.current > 0) return;
      refreshing.current = true;
      try {
        const result = await downloadSupabaseSnapshot();
        if (!result.ok || cancelled) return;
        enableCloudSync();
        const signature = JSON.stringify(result.snapshot.entities);
        if (signature === remoteSignature.current) return;

        hydrating.current = true;
        importCrmData(result.snapshot, { notifyCloud: false });
        hydrating.current = false;
        remoteSignature.current = signature;
        if (refreshContent) setContentVersion((version) => version + 1);
      } finally {
        hydrating.current = false;
        refreshing.current = false;
      }
    };

    const queueRemoteRefresh = (delay = 250) => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void hydrateFromCloud(true), delay);
    };

    const syncMutation = (event: Event) => {
      if (hydrating.current || !isCloudSyncEnabled()) return;
      const mutation = (event as CustomEvent<CrmCloudMutation>).detail;
      if (!mutation) return;

      pendingMutations.current += 1;
      mutationQueue = mutationQueue
        .then(async () => {
          const result = await applySupabaseMutation(mutation);
          if (!result.ok) throw new Error(result.error);
        })
        .catch((error) => {
          console.error("Не удалось синхронизировать изменение CRM", error);
        })
        .finally(() => {
          pendingMutations.current = Math.max(0, pendingMutations.current - 1);
          queueRemoteRefresh(400);
        });
    };

    const initialize = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      authenticated.current = Boolean(data.session);
      if (authenticated.current) await hydrateFromCloud();
    };

    void initialize().finally(() => {
      if (!cancelled) setReady(true);
    });

    const { data: authListener } = supabase?.auth.onAuthStateChange((event, session) => {
      authenticated.current = Boolean(session);
      if (event === "SIGNED_IN") void hydrateFromCloud(true);
    }) ?? { data: { subscription: null } };

    let realtimeChannel = supabase?.channel("pamyat-crm-data");
    for (const table of crmCloudTables) {
      realtimeChannel = realtimeChannel?.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => queueRemoteRefresh(),
      );
    }
    void realtimeChannel?.subscribe();

    const pollTimer = window.setInterval(() => void hydrateFromCloud(true), 4000);
    const removeRefreshTriggers = registerCloudRefreshTriggers({
      windowTarget: window,
      documentTarget: document,
      refresh: () => queueRemoteRefresh(0),
    });
    window.addEventListener(CLOUD_MUTATION_EVENT, syncMutation);

    return () => {
      cancelled = true;
      authListener.subscription?.unsubscribe();
      if (realtimeChannel && supabase) void supabase.removeChannel(realtimeChannel);
      removeRefreshTriggers();
      window.clearInterval(pollTimer);
      window.clearTimeout(refreshTimer);
      window.removeEventListener(CLOUD_MUTATION_EVENT, syncMutation);
    };
  }, []);

  if (!ready) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Загружаем данные CRM...</main>;
  return (
    <>
      <Fragment key={contentVersion}>{children}</Fragment>
      {criticalFeedback && (
        <div role="status" className="fixed bottom-6 right-6 z-[70] flex max-w-md items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${criticalFeedback.type === "error" ? "bg-amber-500" : "bg-emerald-500"}`}>
            {criticalFeedback.type === "error" ? "!" : "✓"}
          </span>
          <span>{criticalFeedback.message}</span>
          <button aria-label="Закрыть уведомление" className="text-lg leading-none text-slate-400 hover:text-white" onClick={() => setCriticalFeedback(null)}>×</button>
        </div>
      )}
    </>
  );
}
