import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")
import os

def plot_features(tracks):

    os.makedirs("static", exist_ok=True)

    names = [t["track"] for t in tracks]
    dance = [t["danceability"] for t in tracks]
    energy = [t["energy"] for t in tracks]
    tempo = [t["tempo"] for t in tracks]

    plt.figure()
    plt.plot(names, dance, label="Danceability")
    plt.plot(names, energy, label="Energy")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.savefig("static/features.png")
    plt.close()

    plt.figure()
    plt.bar(names, tempo)
    plt.xticks(rotation=45)
    plt.title("Tempo per Track")
    plt.tight_layout()
    plt.savefig("static/tempo.png")
    plt.close()