/* Film-grain + vignette texture layer (§4) — pure CSS, pointer-transparent. */
export default function Grain() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
