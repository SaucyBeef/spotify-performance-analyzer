import pandas as pd

def analyze_tracks(tracks):
    if not tracks:
        return {}

    df = pd.DataFrame(tracks)

    # drop rows with missing values where needed
    df = df.dropna(subset=[
        "danceability",
        "energy",
        "tempo",
        "acousticness",
        "duration_ms"
    ])
    if df.empty:
        return {"error": "Not enough valid data"}

    # convert duration to minutes
    df["duration_min"] = df["duration_ms"] / 60000

    analysis = {
        "avg_danceability": df["danceability"].mean(),
        "avg_energy": df["energy"].mean(),
        "avg_tempo": df["tempo"].mean(),
        "avg_acousticness": df["acousticness"].mean(),
        "avg_length_min": df["duration_min"].mean(),

        "most_danceable": df.loc[df["danceability"].idxmax()]["track"],
        "highest_energy": df.loc[df["energy"].idxmax()]["track"],
        "slowest": df.loc[df["tempo"].idxmin()]["track"],
        "fastest": df.loc[df["tempo"].idxmax()]["track"],
        "longest": df.loc[df["duration_min"].idxmax()]["track"],
        "shortest": df.loc[df["duration_min"].idxmin()]["track"]
    }

    return analysis