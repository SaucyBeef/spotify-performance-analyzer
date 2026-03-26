import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")
import numpy as np
import os
import pandas as pd

from analysis import FEATURE_COLUMNS

_DARK_BG = (1, 1, 1, 0.03)
_PANEL_BORDER = (1, 1, 1, 0.12)
_DARK_GRID = "#555555"
_DARK_TEXT = "#e0e0e0"
_SPOTIFY_GREEN = "#1db954"
_SPOTIFY_LIGHT = "#75ffb6"

_MAIN_FEATURES = {
    "danceability": "#1db954",
    "energy": "#75ffb6",
    "acousticness": "#3ab0ff",
    "valence": "#89c8ff"
}

_FEATURE_LABELS = {
    "duration_min": "Length"
}


def _apply_dark_theme(ax, fig):
    fig.patch.set_facecolor(_DARK_BG)
    fig.patch.set_alpha(_DARK_BG[3])
    ax.set_facecolor(_DARK_BG)
    ax.patch.set_alpha(_DARK_BG[3])
    for spine in ax.spines.values():
        spine.set_color("#4a4a4a")
    ax.title.set_color(_DARK_TEXT)
    ax.xaxis.label.set_color(_DARK_TEXT)
    ax.yaxis.label.set_color(_DARK_TEXT)
    ax.tick_params(colors=_DARK_TEXT)
    ax.grid(color=_DARK_GRID)

sdf
def _style_legend(ax):
    legend = ax.get_legend()
    if not legend:
        return
    frame = legend.get_frame()
    frame.set_facecolor(_DARK_BG)
    frame.set_alpha(_DARK_BG[3])
    frame.set_edgecolor(_PANEL_BORDER)
    for text in legend.get_texts():
        text.set_color(_DARK_TEXT)


def _ensure_output_dir(path="static"):
    os.makedirs(path, exist_ok=True)
    return path


def _normalize_frame(tracks):
    df = pd.DataFrame(tracks)
    required = ["rb_popularity", "duration_ms"] + FEATURE_COLUMNS
    df = df.dropna(subset=required)
    if df.empty:
        return df

    df["rb_popularity"] = pd.to_numeric(df["rb_popularity"], errors="coerce")
    for feature in FEATURE_COLUMNS:
        df[feature] = pd.to_numeric(df[feature], errors="coerce")

    df = df.dropna(subset=required)
    return df.sort_values("rb_popularity")


def plot_features(tracks):
    output_dir = _ensure_output_dir()
    df = _normalize_frame(tracks)
    if df.empty:
        return

    color_cycle = plt.cm.get_cmap("tab10")
    color_map = {feature: color_cycle(i % 10) for i, feature in enumerate(FEATURE_COLUMNS)}
    combo_features = [f for f in _MAIN_FEATURES.keys() if f in df.columns]
    chart_features = [f for f in FEATURE_COLUMNS if f != "instrumentalness"]

    fig, ax = plt.subplots(figsize=(10, 6))
    _apply_dark_theme(ax, fig)
    for feature in combo_features:
        ax.plot(
            df["rb_popularity"],
            df[feature],
            label=feature.title(),
            marker="o",
            color=_MAIN_FEATURES[feature]
        )
    ax.set_xlabel("Spotify Popularity")
    ax.set_ylabel("Feature Value")
    ax.set_title("Core Features by Popularity")
    ax.grid(alpha=0.3)
    ax.set_ylim(0, 1)
    ax.legend()
    _style_legend(ax)
    _apply_dark_theme(ax, fig)
    fig.tight_layout()
    fig.savefig(
        os.path.join(output_dir, "features.png"),
        facecolor=_DARK_BG,
        edgecolor="none",
        transparent=False
    )
    plt.close(fig)

    for feature in chart_features:
        fig, ax = plt.subplots(figsize=(8, 5))
        _apply_dark_theme(ax, fig)
        label = _FEATURE_LABELS.get(feature, feature.title())
        ax.scatter(
            df["rb_popularity"],
            df[feature],
            label=label,
            color=_SPOTIFY_GREEN,
            alpha=0.8
        )

        if len(df) >= 2 and df["rb_popularity"].nunique() > 1:
            coeffs = np.polyfit(df["rb_popularity"], df[feature], 1)
            trend = np.polyval(coeffs, df["rb_popularity"])
            ax.plot(
                df["rb_popularity"],
                trend,
                linestyle="--",
                color=_SPOTIFY_LIGHT,
                label="Trend"
            )

        ax.set_xlabel("Spotify Popularity")
        ax.set_ylabel(label)
        ax.set_title(f"{label} by Popularity")
        ax.grid(alpha=0.3)
        ax.legend()
        _style_legend(ax)
        _apply_dark_theme(ax, fig)
        fig.tight_layout()
        fig.savefig(
            os.path.join(output_dir, f"feature_{feature}.png"),
            facecolor=_DARK_BG,
            edgecolor="none",
            transparent=False
        )
        plt.close(fig)

    if "duration_ms" in df.columns:
        df["length_min"] = df["duration_ms"] / 60000
        fig, ax = plt.subplots(figsize=(8, 5))
        _apply_dark_theme(ax, fig)
        ax.scatter(
            df["rb_popularity"],
            df["length_min"],
            label="Length (min)",
            color=_SPOTIFY_GREEN,
            alpha=0.8
        )

        if len(df) >= 2 and df["rb_popularity"].nunique() > 1:
            coeffs = np.polyfit(df["rb_popularity"], df["length_min"], 1)
            trend = np.polyval(coeffs, df["rb_popularity"])
            ax.plot(
                df["rb_popularity"],
                trend,
                linestyle="--",
                color=_SPOTIFY_LIGHT,
                label="Trend"
            )

        ax.set_xlabel("Spotify Popularity")
        ax.set_ylabel("Length (minutes)")
        ax.set_title("Length by Popularity")
        ax.grid(alpha=0.3)
        ax.legend()
        _style_legend(ax)
        fig.tight_layout()
        fig.savefig(
            os.path.join(output_dir, "feature_length.png"),
            facecolor=_DARK_BG,
            edgecolor="none",
            transparent=False
        )
        plt.close(fig)
