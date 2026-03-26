import math
import pandas as pd

FEATURE_COLUMNS = [
    "tempo",
    "duration_min",
    "acousticness",
    "energy",
    "valence",
    "danceability"
]


def _weighted_mean(series, weights):
    total_weight = weights.sum()
    if total_weight == 0:
        return None
    return (series * weights).sum() / total_weight


def _weighted_correlation(x, y, weights):
    x = x.astype(float)
    y = y.astype(float)
    weights = weights.astype(float)
    total_weight = weights.sum()
    if total_weight <= 0:
        return None

    mean_x = _weighted_mean(x, weights)
    mean_y = _weighted_mean(y, weights)
    if mean_x is None or mean_y is None:
        return None

    cov = (weights * (x - mean_x) * (y - mean_y)).sum() / total_weight
    var_x = (weights * (x - mean_x) ** 2).sum() / total_weight
    var_y = (weights * (y - mean_y) ** 2).sum() / total_weight
    if var_x <= 0 or var_y <= 0:
        return None

    return cov / math.sqrt(var_x * var_y)


def _build_feature_correlations(df, feature_columns, weight_column):
    correlations = {}
    if weight_column not in df.columns:
        return correlations

    weights = df[weight_column].astype(float)
    if weights.sum() <= 0:
        return correlations

    for feature in feature_columns:
        if feature not in df.columns:
            continue

        values = df[feature].astype(float)
        corr_value = _weighted_correlation(weights, values, weights)
        feature_summary = {
            "samples": len(df),
            "weighted_average": _weighted_mean(values, weights)
        }

        if corr_value is not None:
            feature_summary["correlation"] = round(corr_value, 4)

        correlations[feature] = feature_summary

    return correlations

def analyze_tracks(tracks):
    if not tracks:
        return {}

    df = pd.DataFrame(tracks)

    # drop rows with missing values where needed
    required_columns = [
        "duration_ms",
        "tempo",
        "instrumentalness",
        "acousticness",
        "energy",
        "valence",
        "danceability",
        "rb_popularity"
    ]
    df = df.dropna(subset=required_columns)
    if df.empty:
        return {"error": "Not enough valid data"}

    # convert duration to minutes
    df["duration_min"] = df["duration_ms"] / 60000

    correlations = _build_feature_correlations(df, FEATURE_COLUMNS, "rb_popularity")

    analysis = {
        # chart average
        "avg_length": df["duration_min"].mean(),
        "avg_tempo": df["tempo"].mean(),
        "ave_instrumentalness": df["instrumentalness"].mean(),
        "avg_acousticness": df["acousticness"].mean(),
        "avg_energy": df["energy"].mean(),
        "ave_valence": df["valence"].mean(),
        "avg_danceability": df["danceability"].mean(),

        # chart focus
        "longest_track": df.loc[df["duration_min"].idxmax()]["track"],
        "highest_tempo": df.loc[df["tempo"].idxmax()]["tempo"],
        "most_instrumental": df.loc[df["instrumentalness"].idxmax()]["track"],
        "most_acoustic": df.loc[df["acousticness"].idxmax()]["track"],
        "highest_energy": df.loc[df["energy"].idxmax()]["track"],
        "highest_valency": df.loc[df["valence"].idxmax()]["track"],
        "most_danceable": df.loc[df["danceability"].idxmax()]["track"],
        "feature_correlations": correlations
    }

    return analysis
