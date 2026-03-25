import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [artist, setArtist] = useState("");
    const [data, setData] = useState(null);

    const fetchData = async () => {
        const res = await fetch(
            `http://127.0.0.1:5000/analyze?artist=${artist}`
        );
        const json = await res.json();
        setData(json);
    };

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Spotify Performance Analyzer</h1>

            <div className="input-group mb-4">
                <input
                    className="form-control"
                    placeholder="Enter artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                />
                <button className="btn btn-primary" onClick={fetchData}>
                    Search
                </button>
            </div>

            {data && (
                <>
                    {/* Top Tracks */}
                    <h3>Top 10 Tracks</h3>
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Title</th>
                            <th>Artists</th>
                            <th>Spotify Popularity</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.tracks.map((t, i) => (
                            <tr key={i}>
                                <td>{t.track}</td>
                                <td>{t.artists}</td>
                                <td>{t.spotify_popularity}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* Analysis */}
                    <h3>Analysis</h3>
                    <ul>
                        <li>Avg Danceability: {data.analysis.avg_danceability.toFixed(2)}</li>
                        <li>Avg Energy: {data.analysis.avg_energy.toFixed(2)}</li>
                        <li>Avg Tempo: {data.analysis.avg_tempo.toFixed(2)}</li>
                        <li>Most Danceable: {data.analysis.most_danceable}</li>
                        <li>Highest Energy: {data.analysis.highest_energy}</li>
                    </ul>

                    {/* Charts */}
                    <h3>Charts</h3>
                    <img
                        src={`http://127.0.0.1:5000${data.charts.features}`}
                        alt="features"
                        className="img-fluid mb-3"
                    />
                    <img
                        src={`http://127.0.0.1:5000${data.charts.tempo}`}
                        alt="tempo"
                        className="img-fluid"
                    />
                </>
            )}
        </div>
    );
}

export default App;