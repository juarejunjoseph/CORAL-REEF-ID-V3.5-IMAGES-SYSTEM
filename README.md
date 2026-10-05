# Coral Reef Identification System V4

A redesigned, mobile-first PWA for AI-assisted identification of coral and associated reef organisms.

## What changed from V3.5

- Modern React + Vite structure
- Mobile-first scanning UI
- Gallery upload and camera capture
- Live camera scanning with throttled inference
- Stable live result based on multiple frames instead of every animation frame
- Top-3 predictions with confidence labels
- Low-confidence guidance instead of blindly treating the top class as certain
- On-device scan history using localStorage
- Species/reference catalog for the bundled model classes
- Model manager for loading a newer Teachable Machine export directly in the browser
- PWA manifest and service-worker support for offline-friendly use
- Clear distinction between Anthozoa classes and associated reef organisms present in the trained model

## Model

The default model remains the existing Teachable Machine export in:

\`public/coralimagemodel/model.json\`
\`public/coralimagemodel/weights.bin\`
\`public/coralimagemodel/metadata.json\`

The original export is a 24-class image model with 224px input.

The app also supports replacing the model at runtime by selecting the three export files from a matching Teachable Machine image-model export.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

For a production build:

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Deployment

Compatible with Netlify.

- Build command: \`npm run build\`
- Publish directory: \`dist\`

Camera access requires a secure context such as HTTPS (or localhost during development).

## Philippine reef reference

Reference catalog:

https://likasmap.com/species/class/Anthozoa

The LikasMap Anthozoa page is treated as a reference source for future taxonomy expansion. The bundled model's label set is not assumed to be taxonomically identical to the Anthozoa list; for example, the model also includes sea stars.

## Important identification note

The system is an AI-assisted visual classifier. A probability value is not a taxonomic certainty or field validation. For research, biodiversity records, or conservation decisions, verify observations using accepted taxonomic references and, when appropriate, expert review.
