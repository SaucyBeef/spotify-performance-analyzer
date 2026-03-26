from pathlib import Path
from PIL import Image


def main():
    path = Path("src/assets/spotify-waveform.png")
    if not path.exists():
        raise FileNotFoundError(path)
    img = Image.open(path).convert("RGBA")
    pixels = []

    for r, g, b, a in img.getdata():
        if r > 240 and g > 240 and b > 240:
            pixels.append((r, g, b, 0))
        else:
            pixels.append((r, g, b, a))

    img.putdata(pixels)
    img.save(path)
    print("cleaned", path)


if __name__ == "__main__":
    main()
