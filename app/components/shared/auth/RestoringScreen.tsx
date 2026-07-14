/** Full-screen spinner shown while useSessionRestore settles. */
export function RestoringScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
