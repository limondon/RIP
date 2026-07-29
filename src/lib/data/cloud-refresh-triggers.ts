interface EventTargetLike {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface VisibilityTargetLike extends EventTargetLike {
  visibilityState?: string;
}

export function registerCloudRefreshTriggers(input: {
  windowTarget: EventTargetLike;
  documentTarget: VisibilityTargetLike;
  refresh: () => void;
}) {
  const { windowTarget, documentTarget, refresh } = input;
  const refreshWhenVisible = () => {
    if (documentTarget.visibilityState !== "hidden") refresh();
  };

  windowTarget.addEventListener("focus", refresh);
  windowTarget.addEventListener("pageshow", refresh);
  windowTarget.addEventListener("online", refresh);
  documentTarget.addEventListener("visibilitychange", refreshWhenVisible);

  return () => {
    windowTarget.removeEventListener("focus", refresh);
    windowTarget.removeEventListener("pageshow", refresh);
    windowTarget.removeEventListener("online", refresh);
    documentTarget.removeEventListener("visibilitychange", refreshWhenVisible);
  };
}
