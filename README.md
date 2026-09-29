# PistonLab

An interactive 3D web app for learning how a four-stroke combustion engine works.

- **Engine Explorer** (`/explore`): an animated inline-4 DOHC engine. Orbit it, switch between cutaway, X-ray and solid views, explode it, and click any of 16 components to read about it (with a guided tour).
- **4-Stroke Lab** (`/cycle`): a single-cylinder cutaway with air/fuel particles, spark and flame front, a live P-V diagram, gauges and a cycle scrubber.
- **Quiz** (`/quiz`): ten questions to check your understanding.

Built with Next.js (App Router), React Three Fiber, drei, postprocessing and zustand. All geometry is procedural, so there are no 3D model files to load.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Deploys to Vercel with zero configuration.
