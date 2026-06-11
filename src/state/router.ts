import { useStore, isNodeId } from './store';
import type { Act, NodeId } from './store';

interface Route {
  target: 'threshold' | 'hub';
  chamber: NodeId | null;
}

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (h === 'hub') return { target: 'hub', chamber: null };
  const m = /^hub\/([a-z]+)$/.exec(h);
  if (m && isNodeId(m[1])) return { target: 'hub', chamber: m[1] };
  /* M8.12 — anything else is lost coordinates: fall back to the threshold,
     but surface the in-world 404 so the wrong turn is acknowledged */
  if (h !== '') useStore.getState().setLost(true);
  return { target: 'threshold', chamber: null };
}

/* Stable acts map to a hash; transitional acts (boot/breach/reverse-breach) do not. */
function hashFor(act: Act, chamber: NodeId | null): string | null {
  if (act === 'chamber' && chamber) return `#/hub/${chamber}`;
  if (act === 'hub') return '#/hub';
  if (act === 'threshold') return '#/';
  return null;
}

function routeHash(r: Route): string {
  if (r.target === 'hub') return r.chamber ? `#/hub/${r.chamber}` : '#/hub';
  return '#/';
}

export function initRouter(): void {
  useStore.getState().setEntry(parse(location.hash));

  /* store → hash */
  useStore.subscribe((s, prev) => {
    if (s.act === prev.act && s.chamber === prev.chamber) return;
    const h = hashFor(s.act, s.chamber);
    if (h === null) return;
    const cur = location.hash === '' || location.hash === '#' ? '#/' : location.hash;
    if (cur !== h) location.hash = h;
  });

  /* hash → store (back/forward, hand-edited URLs) */
  window.addEventListener('hashchange', () => {
    const st = useStore.getState();
    const want = parse(location.hash);
    if (routeHash(want) === hashFor(st.act, st.chamber)) return; // echo of our own write
    if (st.act === 'boot') {
      st.setEntry(want);
      return;
    }
    if (want.target === 'threshold') {
      st.gotoThreshold();
    } else if (want.chamber) {
      if (st.act === 'hub') st.openChamber(want.chamber);
      else useStore.setState({ act: 'chamber', chamber: want.chamber });
    } else {
      if (st.act === 'chamber') st.closeChamber();
      else st.skipToHub();
    }
  });
}
