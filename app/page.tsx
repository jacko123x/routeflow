import Link from "next/link";

const workspaces = [
  {
    href: "/admin",
    eyebrow: "School Transport Staff",
    title: "Admin Control",
    description: "Manage routes, pupils, schools, operators, drivers, fleet compliance, tickets, and incidents.",
    stats: ["126 routes", "16 operators", "31 documents queued"]
  },
  {
    href: "/operator",
    eyebrow: "Bus Operator / Driver",
    title: "Run Workspace",
    description: "View today's assigned runs, manage the stop manifest, board pupils, report incidents, and upload documents.",
    stats: ["2 runs today", "5 pupils next stop", "1 document due"]
  },
  {
    href: "/parent",
    eyebrow: "Parents",
    title: "Family Portal",
    description: "Track the school journey, manage child details, payments, support tickets, and live notifications.",
    stats: ["Pickup 08:04", "1 unread alert", "EUR 48 due"]
  }
];

function Logo() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="RouteFlow">
      <path className="logo-route" d="M13 43 C22 31, 42 33, 51 20" />
      <circle className="logo-pin start" cx="13" cy="43" r="3" />
      <circle className="logo-pin end" cx="51" cy="20" r="3" />
      <path className="logo-ear left" d="M18 25 C7 23, 6 39, 17 45 C12 36, 13 29, 18 25Z" />
      <path className="logo-ear right" d="M46 25 C57 23, 58 39, 47 45 C52 36, 51 29, 46 25Z" />
      <path className="logo-face" d="M16 31 C16 18, 25 11, 32 11 C39 11, 48 18, 48 31 C48 45, 40 53, 32 53 C24 53, 16 45, 16 31Z" />
      <path className="logo-muzzle" d="M24 38 C24 32, 29 29, 32 29 C35 29, 40 32, 40 38 C40 44, 36 47, 32 47 C28 47, 24 44, 24 38Z" />
      <circle className="logo-eye" cx="26" cy="29" r="2" />
      <circle className="logo-eye" cx="38" cy="29" r="2" />
      <path className="logo-nose" d="M29 37 C30 34, 34 34, 35 37 C34 39, 30 39, 29 37Z" />
      <path className="logo-smile" d="M32 39 C30 42, 27 42, 26 40 M32 39 C34 42, 37 42, 38 40" />
      <path className="logo-flow" d="M21 18 C25 22, 30 23, 32 17 C34 23, 39 22, 43 18" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="role-home">
      <section className="role-hero">
        <div className="brand-block role-brand">
          <div className="brand-mark" aria-hidden="true"><Logo /></div>
          <div>
            <h1>RouteFlow</h1>
            <p>School transport, connected.</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">Workspace Entry</p>
          <h2>Choose Your Portal</h2>
          <p className="role-intro">
            Each role now has a separate workspace so Admin, Operators, Drivers, and Parents only see the tools that matter to them.
          </p>
        </div>
      </section>

      <section className="role-grid" aria-label="RouteFlow workspaces">
        {workspaces.map((workspace) => (
          <Link className="role-card" href={workspace.href} key={workspace.href}>
            <span>{workspace.eyebrow}</span>
            <strong>{workspace.title}</strong>
            <p>{workspace.description}</p>
            <div>
              {workspace.stats.map((stat) => <small key={stat}>{stat}</small>)}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
