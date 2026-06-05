import base64
from typing import Any, Dict, List

from app.schemas import UploadRequest, AnalysisRequest
from app.services.imagery import ImageryService
from app.services.preprocessing import PreprocessingService
from app.services.models import ModelService
from app.services.metrics import BenchmarkMetrics
from app.services.xai import XAIService
from app.services.reporting import ReportService
from app.services.storage import AnalysisStore


class FractureAnalysisPipeline:
    def __init__(self):
        self.imagery = ImageryService()
        self.preprocessing = PreprocessingService()
        self.models = ModelService()
        self.metrics = BenchmarkMetrics()
        self.xai = XAIService()
        self.reporting = ReportService()
        self.storage = AnalysisStore()

    def parse_upload(self, payload: UploadRequest) -> Dict[str, Any]:
        image, image_info = self.imagery.decode_image(payload.image_base64, payload.content_type)
        metadata = {
            'patient_id': payload.patient_id,
            'study_id': payload.study_id,
            'content_type': payload.content_type,
            'image_shape': image.shape,
            'image_info': image_info,
            'supported_detection_models': self.models.supported_detection,
            'supported_segmentation_models': self.models.supported_segmentation,
        }
        return metadata

    def run_analysis(self, request: AnalysisRequest) -> Dict[str, Any]:
        image, image_info = self.imagery.decode_image(request.image_base64, request.content_type)
        processed_image = self.preprocessing.preprocess(image)
        processed_bytes = processed_image.tobytes()
        encoded_processed = base64.b64encode(processed_bytes).decode('utf-8')

        detection_results = self.models.run_detection(processed_bytes, request.selected_models)
        segmentation_results = self.models.run_segmentation(processed_bytes, request.selected_models)
        xai_maps = self.xai.create_maps(processed_image, detection_results)
        benchmark_metrics = self.metrics.calculate(detection_results, request.annotations)
        report = self.reporting.build_report(
            request.patient_id,
            request.study_id,
            detection_results,
            segmentation_results,
            xai_maps,
            benchmark_metrics,
        )

        record = {
            'study_id': request.study_id,
            'status': 'completed',
            'model_outputs': {
                'detection': detection_results,
                'segmentation': segmentation_results,
            },
            'xai_outputs': xai_maps,
            'report': report,
            'metrics': benchmark_metrics,
        }
        self.storage.save_analysis(record)

        return {
            'patient_id': request.patient_id,
            'study_id': request.study_id,
            'image_info': image_info,
            'processed_image': encoded_processed,
            'detection': detection_results,
            'segmentation': segmentation_results,
            'xai': xai_maps,
            'report': report,
            'metrics': benchmark_metrics,
        }
