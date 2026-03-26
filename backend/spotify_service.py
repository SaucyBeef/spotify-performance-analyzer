import base64
import json

import requests
from requests.exceptions import JSONDecodeError
from config import CLIENT_ID, CLIENT_SECRET

rb_feature_cache = {}


def _parse_json_response(response, error_label):
    if response.status_code != 200:
        print(f"{error_label}:", response.status_code, response.text)
        return None

    try:
        return response.json()
    except (JSONDecodeError, json.JSONDecodeError):
        print("FAILED RESPONSE:", response.status_code, response.text)
        return None


def _spotify_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _spotify_get(token, url, error_label):
    response = requests.get(url, headers=_spotify_headers(token))
    return _parse_json_response(response, error_label)


def _spotify_search(token, query, search_type, limit, offset=0):
    response = requests.get(
        "https://api.spotify.com/v1/search",
        headers=_spotify_headers(token),
        params={
            "q": query,
            "type": search_type,
            "limit": limit,
            "offset": offset
        }
    )
    return _parse_json_response(response, "SEARCH ERROR")


def _get_json(url, error_label):
    response = requests.get(url)
    return _parse_json_response(response, error_label)


def get_spotify_token():
    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    b64 = base64.b64encode(auth_str.encode()).decode()

    response = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={
            "Authorization": f"Basic {b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={"grant_type": "client_credentials"}
    )
    data = _parse_json_response(response, "TOKEN ERROR")
    if not data:
        return None

    print('TOKEN TYPE: ', data)
    return data.get("access_token")


def get_artist(name, token):
    data = _spotify_search(token, name, "artist", 1)
    if not data:
        return None

    items = data.get("artists", {}).get("items", [])
    if not items:
        return None

    return items[0]["id"]


def get_top_tracks(artist, token):
    all_tracks = []

    for offset in [0, 10, 20, 30, 40]:
        data = _spotify_search(token, artist, "track", 10, offset=offset)
        if not data:
            continue

        tracks = data.get("tracks", {}).get("items", [])
        all_tracks.extend(tracks)

    return all_tracks


def filter_tracks_by_artist(tracks, artist_id):
    return [
        t for t in tracks
        if any(a["id"] == artist_id for a in t.get("artists", []))
    ]


def get_rb_data(spotify_id):
    url = f"https://api.reccobeats.com/v1/track?ids={spotify_id}"
    data = _get_json(url, "BAD STATUS")
    if not data:
        return None

    if not data or "content" not in data or not data["content"]:
        return None

    track_data = data["content"][0]

    return {
        "id": track_data["id"],
        "popularity": track_data.get("popularity")
    }


def get_audio_features(track_id):
    if track_id in rb_feature_cache:
        return rb_feature_cache[track_id]

    url = f"https://api.reccobeats.com/v1/track/{track_id}/audio-features"
    data = _get_json(url, "BAD STATUS")
    if not data:
        return None

    rb_feature_cache[track_id] = data
    return data


def get_track_cover(track_id, token):
    data = _spotify_get(token, f"https://api.spotify.com/v1/tracks/{track_id}", "TRACK COVER")
    if not data:
        return None

    images = data.get("album", {}).get("images", [])
    if not images:
        return None

    return images[0]["url"]


def build_track_dataset(tracks, token=None):
    dataset = []

    for track in tracks:

        if len(dataset) >= 10:
            break

        spotify_id = track["id"]

        rb_track = get_rb_data(spotify_id)
        if not rb_track:
            continue

        features = get_audio_features(rb_track["id"])
        if not features:
            continue

        cover_url = next(
            (img["url"] for img in track.get("album", {}).get("images", []) if img.get("url")),
            None
        )
        if not cover_url and token:
            cover_url = get_track_cover(spotify_id, token)

        dataset.append({
            # track data
            "track": track["name"],
            "artists": ", ".join([a["name"] for a in track["artists"]]),
            "spotify_popularity": track.get("popularity"),
            "duration_ms": track["duration_ms"],
            "rb_popularity": rb_track.get("popularity"),
            "duration_min": track["duration_ms"] / 60000,
            "cover": cover_url,

            # track features
            "tempo": features.get("tempo"),
            "instrumentalness": features.get("instrumentalness"),
            "acousticness": features.get("acousticness"),
            "energy": features.get("energy"),
            "valence": features.get("valence"),
            "danceability": features.get("danceability")
        })

    return dataset
