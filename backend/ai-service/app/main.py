import io

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
from app.services.pipeline import FractureAnalysisPipeline
from app.services.exporter import ReportExporter
from app.services.pacs_service import PACSService
from app.schemas import UploadRequest, AnalysisRequest, ExportRequest, PACSFetchRequest

app = FastAPI(
    title='FRACTARC AI Service',
    description='AI analysis service for fracture detection, segmentation, XAI, and reporting.',
    version='0.1.0'
)

pipeline = FractureAnalysisPipeline()
exporter = ReportExporter()
pacs = PACSService()

@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'ai-service'}

@app.post('/analysis/upload')
def upload_image(payload: UploadRequest):
    try:
        metadata = pipeline.parse_upload(payload)
        return {'status': 'uploaded', 'metadata': metadata}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post('/analysis/run')
def run_analysis(request: AnalysisRequest):
    try:
        analysis = pipeline.run_analysis(request)
        return analysis
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post('/analysis/export')
def export_analysis(payload: ExportRequest):
    try:
        report = payload.analysis.get('report', {})
        metrics = payload.analysis.get('metrics', {})
        export_payload = {**report, 'benchmark_metrics': metrics}
        fmt = payload.format.lower()

        if fmt == 'json':
            return Response(content=exporter.create_json(export_payload), media_type='application/json')
        if fmt == 'csv':
            return Response(content=exporter.create_csv(export_payload), media_type='text/csv')
        if fmt == 'pdf':
            export_bytes = exporter.create_pdf(export_payload)
            return StreamingResponse(io.BytesIO(export_bytes), media_type='application/pdf')
        if fmt == 'dicom-sr':
            export_bytes = exporter.create_dicom_sr(export_payload)
            return StreamingResponse(io.BytesIO(export_bytes), media_type='application/dicom')

        raise HTTPException(status_code=400, detail='Unsupported export format')
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post('/pacs/fetch')
def fetch_pacs_study(request: PACSFetchRequest):
    try:
        return pacs.fetch_study(request.study_uid)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
