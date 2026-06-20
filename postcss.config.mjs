/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Inline `@import` statements BEFORE Tailwind runs. Without this the
    // `@import`s in `app/globals.css` pass through to the output AFTER the
    // `@tailwind utilities` expansion, which the production CSS optimizer
    // rejects ("@import rules must precede all rules"). postcss-import
    // inlines them IN PLACE, so the modular design-system CSS still emits
    // after Tailwind (cascade preserved). Already present as a transitive
    // dep of tailwindcss. (It logs a harmless "@import must precede…"
    // warning because the imports sit after `@tailwind`, but it inlines
    // them regardless — keeping them in place is what preserves the
    // intended cascade where modular CSS overrides Tailwind utilities.)
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
