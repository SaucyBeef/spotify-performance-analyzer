from flask import Flask, jsonify, request
from flask_cors import CORS

from spotify_service import get_artist, get_top_tracks, build_track_dataset, get_spotify_token, filter_tracks_by_artist
from analysis import analyze_tracks, FEATURE_COLUMNS
from charts import plot_features
import os


app = Flask(__name__)
CORS(app)


@app.route("/analyze")
def analyze():
    artist = request.args.get("artist")
    if not artist:
        return {"error": "Artist name required"}, 400

    token = get_spotify_token()
    if not token:
        return {"error": "Unable to authenticate with Spotify"}, 502

    artist_id = get_artist(artist, token)
    if not artist_id:
        return {"error": "Artist not found"}, 404

    tracks = get_top_tracks(artist, token)
    tracks = filter_tracks_by_artist(tracks, artist_id)
    tracks = sorted(
        tracks,
        key=lambda x: x.get("popularity", 0),
        reverse=True
    )

    dataset = build_track_dataset(tracks, token)
    dataset = sorted(
        dataset,
        key=lambda x: x.get("rb_popularity") or -1,
        reverse=True
    )

    analysis = analyze_tracks(dataset)
    plot_features(dataset)

    per_feature_charts = {
        feature: f"/static/feature_{feature}.png"
        for feature in FEATURE_COLUMNS
    }

    return jsonify({
        "tracks": dataset,
        "analysis": analysis,
        "charts": {
            "features": "/static/features.png",
            "per_feature": per_feature_charts
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
