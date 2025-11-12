# Risk Factor Modifier – Heart Disease Style Game

Interactive, stylized simulation where you tweak risk factor dials, hit Go, and watch a character age towards an estimated lifespan. This is for illustration only — not medical advice.

## Features

- Bright, modern UI with glassmorphism and neon accents
- Five radial dials (rotating knobs): Smoking, Diet, Exercise (inactivity), Blood Pressure, Cholesterol
- Real-time predicted lifespan display
- SVG character that grows, greys, hunches, uses a cane, and ultimately collapses at the predicted lifespan
- Accessible keyboard control for dials (Arrow keys)

## How to run

This is a static web app.

- Option 1: Open `index.html` directly in your browser.
- Option 2 (recommended dev experience): Serve the folder with a simple static server (e.g., VS Code Live Server or any local HTTP server) to avoid font/CORS nuances.

## How it works

- Baseline lifespan is 85 years. Each dial contributes a possible maximum reduction:
  - Smoking: up to 12 years
  - Diet: up to 8 years
  - Exercise (inactivity): up to 7 years
  - Blood Pressure: up to 7 years
  - Cholesterol: up to 6 years
- The higher the dial (0–100), the more years it subtracts proportionally.
- Animation speed subtly increases with higher risk (life passes quicker as risk grows).

## Controls

- Rotate each dial by dragging or using Arrow keys (focus the dial with Tab).
- Press Go to start the life animation.
- Press Reset to reset age and dials.

## Notes

- The model is intentionally simple and illustrative.
- All graphics are inline SVG/CSS — no external dependencies beyond Google Fonts.

## Customization

- Adjust baseline and weights in `script.js`:
  - `BASE_LIFESPAN` and `factors.{key}.weightYears`
- Tweak visuals in `styles.css` for dial sizes (`--size`), gradients, and color tokens.
