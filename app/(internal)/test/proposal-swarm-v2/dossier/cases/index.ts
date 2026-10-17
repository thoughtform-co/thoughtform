import { assertCase } from "../story";
import type { Case } from "../types";
import loop from "./loop.json";
import samako from "./samako.json";
import suri from "./suri.json";

/**
 * The cases, in the order the page tells them. Each file is checked on load
 * (`assertCase`): an unknown figure, a picture outside the published folders,
 * a drawing over the letter cap or a short cut of the wrong length stops the
 * page rather than shipping a broken case.
 */
export const CASES: readonly Case[] = [loop, samako, suri].map((c) =>
  assertCase(c as unknown as Case)
);

export const CASE_IDS = CASES.map((c) => c.id);
