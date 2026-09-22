"""
grounds — the flat KEY GROUND a plate is drawn on, per era (ADR-082 U33).

Two readers, one table: `prompt.py` letters the ground into the plate lock and
the idle, and `gold.py` keys it back out. Written twice, the words and the key
would drift apart the first time an era changed colour, and the symptom would
be a clean-looking plate whose matte eats half the figure.

⚠ THE GROUND IS CHOSEN BY THE WARDROBE, NOT BY TASTE. U31 chose BLUE because it
is the complement of gold and of skin, and because at a luma weight of .114 its
edge-mix barely moves the grade. That holds for every era whose clothes carry no
blue. The 2016 trainer's carry blue AND green (a navy vest, indigo jeans, green
gloves): under the blue key `B − max(R, G)` the vest keys at α ≈ 0.27 and the
jeans at α ≈ 0.74 — the man becomes a ghost in a jacket. MAGENTA keys on
`min(R, B) − G`, and every colour that outfit has (red, navy, indigo, green,
skin, white, black) comes out at or below zero on it: fully opaque.

⚠ A GROUND MUST BE ONE OR TWO SATURATED CHANNELS OVER A DARK REST. The key's
signal is "the ground's own channels, minus the others", so a grey or a pastel
ground has no signal to key on. `gold.chroma_signal` refuses one.
"""

from __future__ import annotations

#: name -> (RGB, hex as the prompt letters it, the colour in the prompt's words)
KEY_GROUNDS: dict[str, tuple[tuple[int, int, int], str, str]] = {
    "blue": ((10, 40, 210), "#0A28D2", "saturated deep blue"),
    "magenta": ((210, 10, 210), "#D20AD2", "saturated magenta"),
}

#: Eras that do NOT stand on the default blue. Absent = blue.
ERA_GROUND: dict[str, str] = {
    "pokemon-go": "magenta",
}


def ground_name(era: str | None) -> str:
    return ERA_GROUND.get(era or "", "blue")


def ground_rgb(era: str | None) -> tuple[int, int, int]:
    return KEY_GROUNDS[ground_name(era)][0]
