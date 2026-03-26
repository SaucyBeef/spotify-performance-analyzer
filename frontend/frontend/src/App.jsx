import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import spotifySymbol from "./assets/spotify-symbol.png";
import spotifyWaveform from "./assets/spotify-waveform.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const FEATURE_DETAILS = [
  {
    key: "duration_min",
    label: "Length",
    unit: "min",
    avgKey: "avg_length",
    highlightKey: "longest_track",
    highlightLabel: "Longest Track"
  },
  {
    key: "tempo",
    label: "Tempo",
    unit: "BPM",
    avgKey: "avg_tempo",
    highlightKey: "highest_tempo",
    highlightLabel: "Peak Tempo",
    highlightSuffix: " BPM",
    highlightPrecision: 1
  },
  {
    key: "danceability",
    label: "Danceability",
    unit: "",
    avgKey: "avg_danceability",
    highlightKey: "most_danceable",
    highlightLabel: "Most Danceable Track"
  },
  {
    key: "energy",
    label: "Energy",
    unit: "",
    avgKey: "avg_energy",
    highlightKey: "highest_energy",
    highlightLabel: "Most Energetic Track"
  },
  {
    key: "acousticness",
    label: "Acousticness",
    unit: "",
    avgKey: "avg_acousticness",
    highlightKey: "most_acoustic",
    highlightLabel: "Most Acoustic Track"
  },
  {
    key: "valence",
    label: "Valence",
    unit: "",
    avgKey: "ave_valence",
    highlightKey: "highest_valency",
    highlightLabel: "Most Positive Track"
  }
];

const SUMMARY_METRICS = [
  { label: "Average Tempo", key: "avg_tempo", unit: "BPM" },
  { label: "Average Danceability", key: "avg_danceability" },
  { label: "Average Energy", key: "avg_energy" },
  { label: "Average Acousticness", key: "avg_acousticness" },
  { label: "Average Valence", key: "ave_valence" }
];

  const FEATURE_DESCRIPTIONS = {
  spotify_popularity:
    "Spotify’s popularity metric is based on the number of plays a track has, with recent plays being weighted heavier.",
  duration_min:
    "Track length in minutes; longer songs allow for more movement and arrangement space.",
  tempo:
      "Represents the measured beats per minute; higher values indicate faster pacing.",
  danceability:
    "Danceability is a composite score based on rhythm stability, beat strength, and tempo" +
      " profile. A higher value represents a song more suited for dancing.",
  energy:
    "Energy is a composite score estimating the overall intensity of a track capturing loudness," +
      " activity, and perceived power. A higher value represents a greater perceived energy.",
  acousticness:
    "Acousticness analyzes the likelihood that a track is primarily acoustic rather than" +
      " electronically produced. A higher value represents a greater likelihood of organic production.",
  valence:
    "valence estimates the felt mood of a track. Higher values will feel bright and happy," +
      " while lower values will feel dissonant and moody."
};

const formatNumber = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toFixed(digits);
};

const formatDurationFromMinutes = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "-";
  }
  const totalSeconds = Math.round(Number(value) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} min`;
};

function App() {
  const shellRef = useRef(null);
  const spotifyLogoRef = useRef(null);
  const [artist, setArtist] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [gradientScale, setGradientScale] = useState(0.08);
  const [gradientAnchor, setGradientAnchor] = useState({ x: 0, y: 0 });
  const [tracksOpen, setTracksOpen] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const fetchData = async () => {
    if (!artist.trim()) {
      setError("Enter an artist to analyze.");
      return;
    }

    setStatus("loading");
    setPhase("Fetching artist data");
    setError("");
    setGradientScale(0.08);
    setSelectedTrack(null);

    try {
      let response;
      try {
        response = await fetch(
          `${API_BASE}/analyze?artist=${encodeURIComponent(artist.trim())}`
        );
      } finally {
        setPhase("Building track data");
      }

      let json;
      try {
        json = await response.json();
      } finally {
        setPhase("Analyzing track data");
      }

      try {
        if (!response.ok) {
          throw new Error(json.error || "Unable to load artist data.");
        }
      } finally {
        setPhase("Fetching charts");
      }

      setData(json);
      setStatus("ready");
      setPhase("");
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setData(null);
      setStatus("error");
      setPhase("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchData();
  };

  const analysis = data?.analysis;
  const perFeatureCharts = useMemo(
    () => data?.charts?.per_feature || {},
    [data?.charts]
  );
  const topTracks = data?.tracks || [];
  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    let frameId;
    let lastTime = performance.now();
    const growthPerSecond = 0.04;
    const maxScale = 3.8;

    const tick = (now) => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;
      setGradientScale((prev) =>
        prev >= maxScale ? prev : Math.min(prev + deltaSeconds * growthPerSecond, maxScale)
      );
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  useEffect(() => {
    const updateAnchor = () => {
      const shell = shellRef.current;
      const logo = spotifyLogoRef.current;
      if (!shell || !logo) {
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const x = logoRect.left - shellRect.left + logoRect.width / 2;
      const y = logoRect.top - shellRect.top + logoRect.height / 2;
      setGradientAnchor({ x, y });
    };

    // Recompute after layout settles so the anchor stays centered on the logo.
    const rafA = requestAnimationFrame(updateAnchor);
    const rafB = requestAnimationFrame(() => requestAnimationFrame(updateAnchor));

    window.addEventListener("resize", updateAnchor);
    const logo = spotifyLogoRef.current;
    if (logo && !logo.complete) {
      logo.addEventListener("load", updateAnchor);
    }

    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
      window.removeEventListener("resize", updateAnchor);
      if (logo) {
        logo.removeEventListener("load", updateAnchor);
      }
    };
  }, [status, data]);

  const gradientEnabled = status !== "idle";
  const shellClassName = [
    "app-shell",
    gradientEnabled ? "app-shell--gradient-on" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={shellRef}
      className={shellClassName}
      style={{
        "--gradient-scale": gradientScale,
        "--gradient-x": `${gradientAnchor.x}px`,
        "--gradient-y": `${gradientAnchor.y}px`
      }}
    >
      <section className="hero-search-panel">
        <div className="hero-top-strip">
          <div className="hero-logo-row">
            <img
              src={spotifySymbol}
              alt="Spotify badge"
              className="hero-logo__symbol"
              ref={spotifyLogoRef}
            />
            <img
              src={spotifyWaveform}
              alt="Waveform badge"
              className="hero-logo__waveform"
            />
          </div>
          <p className="eyebrow">Artist Performance • Live Insight</p>
        </div>

        <header className="hero">
          <h1>Spotify Performance Analyzer</h1>
          <p className="hero-subtitle">
            Search an artist and map which production features align with
            popularity.
          </p>
        </header>

        <div className="search-form-wrap">
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="input-stack">
              <label htmlFor="artist-input">Artist name</label>
              <input
                id="artist-input"
                type="text"
                placeholder="e.g., Tame Impala"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <button type="submit" className="cta-sm">
              {status === "loading" ? "Analyzing..." : "Pull Insight"}
            </button>
          </form>
            <div className="search-meta">
            <div className="search-meta__status">
              {(status !== "loading" || status === "idle") && (
                <span className="status-pill">
                  {status === "ready"
                    ? "Fresh analysis"
                    : status === "loading"
                    ? "Fetching charts"
                    : status === "error"
                    ? "Try again"
                    : "Awaiting search"}
                </span>
              )}
              {phase && <p className="phase-note">{phase}</p>}
            </div>
            {error && <p className="error-note">{error}</p>}
          </div>
        </div>
      </section>

      {analysis && (
      <section className="charts">
        {topTracks.length > 0 && (
          <section className="tracks-panel">
            <button
              type="button"
              className="tracks-panel__toggle"
              aria-expanded={tracksOpen}
              onClick={() => setTracksOpen((prev) => !prev)}
            >
              <span>Current Top 10 Tracks</span>
              <span
                className={`tracks-panel__chevron ${
                  tracksOpen ? "is-open" : ""
                }`}
              >
                ▾
              </span>
            </button>
            {tracksOpen && (
              <div className="tracks-panel__content">
                <p className="tracks-panel__description">
                  Ranked by Spotify popularity with core metrics.
                </p>
                <div
                  className={`tracks-panel__body ${
                    selectedTrack ? "tracks-panel__body--has-preview" : ""
                  }`}
                >
                  <ol className="tracks-panel__list">
                    {topTracks.map((track, index) => (
                      <li
                        className="tracks-panel__item"
                        key={`${track.track}-${index}`}
                      >
                        <span className="tracks-panel__rank">{index + 1}</span>
                        {track.cover ? (
                          <button
                            type="button"
                            className="tracks-panel__cover-btn"
                            onClick={() => setSelectedTrack(track)}
                            aria-label={`Open large cover for ${track.track}`}
                          >
                            <img
                              src={track.cover}
                              alt={`${track.track} cover`}
                              className="tracks-panel__cover"
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          <div
                            className="tracks-panel__cover tracks-panel__cover--empty"
                          />
                        )}
                        <div className="tracks-panel__details">
                          <p className="tracks-panel__title">{track.track}</p>
                          <p className="tracks-panel__artist">{track.artists}</p>
                        </div>
                        <div className="tracks-panel__stats">
                          <span className="tracks-panel__stat">
                            <span className="tracks-panel__stat-label">
                              Popularity
                            </span>
                            <strong>{track.rb_popularity ?? "-"}</strong>
                          </span>
                          <span className="tracks-panel__stat">
                            <span className="tracks-panel__stat-label">Length</span>
                            <strong>{formatDurationFromMinutes(track.duration_min)}</strong>
                          </span>
                          <span className="tracks-panel__stat">
                            <span className="tracks-panel__stat-label">Tempo</span>
                            <strong>{formatNumber(track.tempo, 1)} BPM</strong>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {selectedTrack?.cover && (
                    <aside className="tracks-preview-panel">
                      <button
                        type="button"
                        className="tracks-preview-panel__close"
                        onClick={() => setSelectedTrack(null)}
                        aria-label="Close cover preview"
                      >
                        x
                      </button>
                      <img
                        src={selectedTrack.cover}
                        alt={`${selectedTrack.track} large cover`}
                        className="tracks-preview-panel__image"
                      />
                      <p className="tracks-preview-panel__title">
                        {selectedTrack.track}
                      </p>
                      <p className="tracks-preview-panel__artist">
                        {selectedTrack.artists}
                      </p>
                    </aside>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
        <div className="charts-main-grid">
            <div className="main-chart">
              <div className="main-chart__header">
                <h2>Feature Spread</h2>
                <p>All core features plotted against Spotify popularity.</p>
              </div>
              {data?.charts?.features ? (
                <img
                  src={`${API_BASE}${data.charts.features}`}
                  alt="Feature spread across popularity"
                  loading="lazy"
                />
              ) : (
                <div className="empty-state">Main chart unavailable.</div>
              )}
            </div>

            <aside className="feature-descriptions">
              <div className="feature-descriptions__header">
                <h3>Feature Guide</h3>
                <p>A quick description list for your reference.</p>
              </div>
                <div className="feature-descriptions__list">
                  <div className="feature-descriptions__item">
                    <p className="feature-descriptions__label">
                      Spotify Popularity
                    </p>
                    <p className="feature-descriptions__text">
                      {FEATURE_DESCRIPTIONS.spotify_popularity}
                    </p>
                  </div>
                  {FEATURE_DETAILS
                    .filter((feature) => feature.key !== "duration_min")
                    .map((feature) => (
                  <div className="feature-descriptions__item" key={feature.key}>
                    <p className="feature-descriptions__label">{feature.label}</p>
                    <p className="feature-descriptions__text">
                      {FEATURE_DESCRIPTIONS[feature.key]}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <section className="summary-panel">
            <button
              type="button"
              className="summary-panel__toggle"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen((prev) => !prev)}
            >
              <span>Average Data</span>
              <span
                className={`summary-panel__chevron ${
                  summaryOpen ? "is-open" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {summaryOpen && (
              <div className="summary-panel__content">
                <div className="summary-grid">
                  {SUMMARY_METRICS.map(({ label, key, unit }) => (
                    <article className="summary-card" key={key}>
                      <p className="summary-label">{label}</p>
                      <p className="summary-value">
                        {formatNumber(analysis[key])}
                        {analysis[key] != null && unit && <span> {unit}</span>}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="feature-chart-grid">
            {FEATURE_DETAILS.map((feature) => {
              const chartSrc = perFeatureCharts[feature.key];
              const featureAnalysis =
                analysis?.feature_correlations?.[feature.key] || {};
              const correlation =
                featureAnalysis.correlation == null
                  ? "-"
                  : Number(featureAnalysis.correlation).toFixed(3);
              const weightedAvg = featureAnalysis.weighted_average;
              const highlightRaw = analysis?.[feature.highlightKey];
              const highlightIsNumeric = typeof highlightRaw === "number";
              const highlightDisplay =
                highlightRaw == null
                  ? "-"
                  : highlightIsNumeric
                  ? formatNumber(highlightRaw, feature.highlightPrecision ?? 2)
                  : highlightRaw;
              const highlightSuffix =
                highlightRaw == null || !feature.highlightSuffix
                  ? ""
                  : feature.highlightSuffix;

              return (
                <article className="feature-card" key={feature.key}>
                  <div className="feature-card__meta">
                    <div className="feature-card__meta-left">
                      <div>
                        <p className="feature-label">Average {feature.label}</p>
                        <p className="feature-title">
                          {feature.avgKey && analysis[feature.avgKey] != null
                            ? feature.key === "duration_min"
                              ? formatDurationFromMinutes(
                                  analysis[feature.avgKey]
                                )
                              : formatNumber(analysis[feature.avgKey])
                            : "-"}
                          {feature.key !== "duration_min" && feature.unit && (
                            <span className="feature-unit"> {feature.unit}</span>
                          )}
                        </p>
                      </div>
                      <div className="feature-card__highlight-inline">
                        <p className="feature-card__highlight-label">
                          {feature.highlightLabel}
                        </p>
                        <p className="feature-card__highlight-value">
                          {highlightDisplay}
                          {highlightRaw != null && highlightSuffix && (
                            <span className="feature-unit">{highlightSuffix}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="feature-card__meta-right">
                      <p className="feature-correlation">Correlation: {correlation}</p>
                      {weightedAvg != null && (
                        <p className="feature-weighted">
                          Weighted Average: {formatNumber(weightedAvg)}
                        </p>
                      )}
                    </div>
                  </div>

                  {chartSrc ? (
                    <img
                      src={`${API_BASE}${chartSrc}`}
                      alt={`${feature.label} vs popularity`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="empty-state">Chart unavailable.</div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
