
export function DecorativeShapes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      <div
        className="absolute -right-32 top-1/4 h-96 w-72 rounded-3xl bg-paper/10"
        style={{ transform: 'rotate(-12deg)' }}
      />
      <div
        className="absolute -left-40 bottom-8 h-72 w-64 rounded-3xl bg-brand-700/60"
        style={{ transform: 'rotate(8deg)' }}
      />
    </div>
  );
}