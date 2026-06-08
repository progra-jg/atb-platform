const errorTarget = new EventTarget();

export function emitApiError(message: string) {
  errorTarget.dispatchEvent(new CustomEvent("api-error", { detail: message }));
}

export function onApiError(cb: (msg: string) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
  errorTarget.addEventListener("api-error", handler);
  return () => errorTarget.removeEventListener("api-error", handler);
}
