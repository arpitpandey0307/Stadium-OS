export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      {/* Hero Section */}
      <main className="flex flex-1 w-full max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        {/* Glowing badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
          </span>
          System Online
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="text-white">Stadium</span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            OS
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-2xl text-lg text-gray-400 sm:text-xl">
          Multi-Agent Coordination Engine — Real-time simulation &amp;
          optimization of large-scale stadium operations.
        </p>

        {/* Architecture diagram */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm font-mono">
          {[
            "Simulation",
            "→",
            "Database",
            "→",
            "Agents",
            "→",
            "Coordinator",
            "→",
            "API",
            "→",
            "Dashboard",
          ].map((item, i) =>
            item === "→" ? (
              <span key={i} className="text-cyan-500">
                →
              </span>
            ) : (
              <span
                key={i}
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-gray-300"
              >
                {item}
              </span>
            )
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 flex gap-4">
          <a
            href="/dashboard"
            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-gray-950 transition hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            Open Dashboard
          </a>
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-gray-800"
          >
            API Status
          </a>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: "👥",
              title: "Crowd Agent",
              desc: "Density monitoring",
            },
            {
              icon: "🍔",
              title: "Vendor Agent",
              desc: "Queue optimization",
            },
            {
              icon: "🛡️",
              title: "Security Agent",
              desc: "Spike detection",
            },
            {
              icon: "🚌",
              title: "Transport Agent",
              desc: "Exit flow control",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-5 text-left transition hover:border-cyan-500/50 hover:bg-gray-800/50"
            >
              <div className="text-2xl">{card.icon}</div>
              <h3 className="mt-2 font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800 py-6 text-center text-sm text-gray-600">
        StadiumOS v1.0 · Hackathon 2026
      </footer>
    </div>
  );
}
