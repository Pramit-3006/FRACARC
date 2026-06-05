# FRACTARC Architecture

## Overview

FRACTARC is composed of three main layers:

1. Frontend: React + Next.js application for clinical dashboards, image review, annotation, and reporting.
2. Gateway: Node.js API gateway that handles authentication, authorization, audit logging, caching, and routes requests to services.
3. AI Service: Python FastAPI microservice responsible for image preprocessing, model orchestration, explainability, benchmarking, and report generation.

## Data flow

- The frontend sends uploads and analysis requests to the gateway.
- The gateway validates JWT authentication, enforces RBAC, and forwards requests to the AI service.
- The AI service executes preprocessing, inference, XAI, and generates structured clinical reports.
- Results are stored in PostgreSQL/MongoDB and returned to the frontend.

## Deployment

- Local development: Docker Compose with PostgreSQL, MongoDB, Redis, gateway, AI service, and frontend.
- Production: Kubernetes manifests for scalable service deployment, GPU scheduling, and secure ingress.

## AI pipeline

1. Data ingestion and DICOM parsing
2. Image enhancement (CLAHE, histogram equalization, bone enhancement, super-resolution)
3. Model inference with multiple detection and segmentation backbones
4. XAI map generation and overlay composition
5. Metrics computation: IoU, Dice, precision, recall, mAP, confidence fusion
6. Report generation and storage

## Compliance

FRACTARC is designed with HIPAA-ready patterns: encrypted storage, JWT, role-based access, audit logs, secure APIs, and configurable privacy controls.
