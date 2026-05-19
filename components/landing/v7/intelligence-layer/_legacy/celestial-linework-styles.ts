/**
 * Stable id for the CelestialLinework's inline `<style>` element.
 * Lifted to its own module so React doesn't warn about duplicate
 * ids when the component mounts in StrictMode (which renders the
 * component twice in dev). The id is shared across mounts so the
 * second mount finds the existing style tag instead of inserting a
 * duplicate.
 */

export const CELESTIAL_LINEWORK_CSS_ID = "tf-celestial-linework-styles";
