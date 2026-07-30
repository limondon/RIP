export const CRITICAL_OPERATION_FEEDBACK_EVENT = "pamyat-crm-critical-operation-feedback";

export interface CriticalOperationFeedback {
  message: string;
  type: "success" | "error";
}

export function publishCriticalOperationFeedback(
  message: string,
  type: CriticalOperationFeedback["type"],
) {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  window.dispatchEvent(new CustomEvent<CriticalOperationFeedback>(
    CRITICAL_OPERATION_FEEDBACK_EVENT,
    { detail: { message, type } },
  ));
}
