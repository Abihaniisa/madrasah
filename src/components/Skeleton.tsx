/* Silent loading state.
   The app has fast fetches; a skeleton flash is noise, not signal.
   If a fetch is ever genuinely slow, the caller can render its own
   placeholder. Nothing is exported that forces a shape on the page. */

export function Skeleton(_: { rows?: number }) {
  return null;
}

export function DelayedSkeleton(_: { ready: boolean; rows?: number; delay?: number }) {
  return null;
}
