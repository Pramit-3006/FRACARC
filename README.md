# FRACTARC

FRACTARC is a modular, enterprise-grade AI fracture analysis platform for medical X-ray interpretation. It is designed as a research and clinical tool with multi-model benchmarking, explainable AI, rich reporting, and hospital-grade workflow support.

## Core capabilities

- Multi-model fracture detection, classification, segmentation, and localization
- AI explainability using Grad-CAM, SHAP, LIME, and overlay visualizations
- Comparative human-vs-AI annotation analysis, IoU/Dice and confidence scoring
- Clinical-style report generation (PDF / CSV / JSON / DICOM-SR)
- Role-based authentication, PACS/DICOM integration, audit logging
- GPU-accelerated inference, ensemble fusion, research benchmarking

## Architecture

- `frontend/`: Next.js + TypeScript UI with TailwindCSS
- `backend/gateway/`: Node.js API gateway, auth, caching, and proxy logic
- `backend/ai-service/`: Python FastAPI AI pipeline, preprocessing, model orchestration, XAI, reporting, exports, and PACS integration
- `backend/infra/`: Docker Compose and Kubernetes manifests for production deployment
- `db/`: SQL schema and model definitions for PostgreSQL/MongoDB

## Getting started

1. Install dependencies in `frontend/` and `backend/gateway/`:
   - `npm install`
2. Install Python dependencies in `backend/ai-service/`:
   - `pip install -r requirements.txt`
3. Start the platform locally with Docker Compose:
   - `docker compose up --build`
4. Open the frontend at `http://localhost:3000`
5. Upload an X-ray and run analysis.
6. Export the radiology report as JSON, CSV, PDF, or DICOM-SR from the UI.
7. Use the PACS integration endpoint for study fetch workflows.

## Notes

This scaffold includes a working API gateway, FastAPI AI microservice, React/Next.js frontend, Docker Compose orchestration, PostgreSQL, MongoDB, and Redis support.

The current implementation uses model stubs and explainability placeholders that are ready for production integration with real fracture detection, segmentation, XAI, and benchmarking models.
