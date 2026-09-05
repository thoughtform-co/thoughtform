# The image types

The axis is the client's own. Take the questions their brief asks of every
subject and answer each with a shot; those questions are the taxonomy,
reflected back rather than replaced. Nothing invented, nothing dropped. The
structure lives in `armada.toml [types.*]`; this file is the human-readable
copy that says why.

The example rows are the template's fictional brand. Replace them.

|       | Type      | The client's question                        | What it is                                                            | Channel              | Master | Cut to |
| ----- | --------- | -------------------------------------------- | --------------------------------------------------------------------- | -------------------- | ------ | ------ |
| **H** | Hero      | _"what is the thing itself?"_                | The subject alone on a slate slab against a flat sweep.               | Product tile         | 1:1    | —      |
| **L** | Lifestyle | _"where does it live?"_                      | The bench in working order, subject set down on it rather than posed. | Homepage, journal    | 3:2    | 16:9   |
| **P** | Proof     | _"what proves it was made and not moulded?"_ | The evidence, close, in raking light.                                 | Paid social          | 4:5    | 9:16   |
| **C** | Craft     | _"what did the hand leave behind?"_          | Macro on one edge or seam.                                            | Website detail strip | 3:2    | 2:1    |
| **E** | Payoff    | _"what is left when the work stops?"_        | The emptied surface after. Subject absent, or barely at the edge.     | CRM header           | 4:5    | 9:16   |

## The difference table

What makes each frame its own photograph, declared before generating, never
left to sampling. Lives in `armada.toml` beside each type, and
`tools/wave.py --audit` fails the wave if any two types share all three axes.

| Type | Camera height                              | Subject sits                               | Dominant shape                          |
| ---- | ------------------------------------------ | ------------------------------------------ | --------------------------------------- |
| H    | square on, a little below the rim          | dead centre, filling the frame             | the silhouette against the sweep        |
| L    | high, looking down the length of the bench | far left, small against the run of it      | the bench and what is on it             |
| P    | raking, almost along the surface           | pushed to the top edge, evidence beneath   | the surface itself under raking light   |
| C    | macro, a hand's width away                 | one edge crossing corner to corner         | a single edge or seam                   |
| E    | standing above, looking straight down      | absent; the emptied surface is the subject | the shape the light leaves on the slate |

## The proof register

One physical proof per subject, never repeated across the set. Fill in from
the brief; where the brief is silent, mark the proof as **ours until the
client confirms**, and say so on the board.

| Subject | Proof | Place | Source |
| ------- | ----- | ----- | ------ |
| —       | —     | —     | —      |
