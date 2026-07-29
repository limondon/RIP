"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { downloadSupabaseSnapshot, isCloudSyncEnabled, uploadLocalSnapshotToSupabase } from "@/lib/data/supabase-repository";
import { importCrmData } from "@/lib/data/repository";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const CLOUD_CHANGE_EVENT = "pamyat-crm-data-changed";

export function CloudDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const hydrating = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let syncTimer: number | undefined;

    const hydrateFromCloud = async (reloadAfterImport = false) => {
      const result = await downloadSupabaseSnapshot();
      if (!result.ok || cancelled) return;
      const rowCount = Object.values(result.snapshot.entities).reduce((count, rows) => count + rows.length, 0);
      if (!rowCount) return;

      hydrating.current = true;
      importCrmData(result.snapshot);
      hydrating.current = false;
      window.localStorage.setItem("pamyat-cloud-sync-enabled", "true");
      if (reloadAfterImport) window.location.reload();
    };

    const queueCloudUpload = () => {
      if (hydrating.current || !isCloudSyncEnabled()) return;
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(() => {
        void uploadLocalSnapshotToSupabase();
      }, 750);
    };

    void hydrateFromCloud().finally(() => {
      if (!cancelled) setReady(true);
    });

    const supabase = getBrowserSupabaseClient();
    const { data: authListener } = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void hydrateFromCloud(true);
    }) ?? { data: { subscription: null } };

    window.addEventListener(CLOUD_CHANGE_EVENT, queueCloudUpload);

    return () => {
      cancelled = true;
      authListener.subscription?.unsubscribe();
      window.clearTimeout(syncTimer);
      window.removeEventListener(CLOUD_CHANGE_EVENT, queueCloudUpload);
    };
  }, []);

  if (!ready) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Загружаем данные CRM...</main>;
  return <>{children}</>;
}
