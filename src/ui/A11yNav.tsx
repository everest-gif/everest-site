import { NODES } from '../content/nodes';

/* Text equivalent of the WebGL hub for screen readers and crawlers (§9.8). */
export default function A11yNav() {
  return (
    <nav className="visually-hidden" aria-label="Portfolio sections">
      <h1>Everest — builder of autonomous systems</h1>
      <p>
        Portfolio of Everest Egenhofer. Boulder, Colorado. An orchestration hub of eight projects —
        choose a section:
      </p>
      <ul>
        {NODES.map((n) => (
          <li key={n.id}>
            <a href={`#/hub/${n.id}`} tabIndex={-1}>
              {n.label} — {n.role}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
