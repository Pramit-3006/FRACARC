from pydantic import BaseModel
from typing import List, Optional

class UploadRequest(BaseModel):
    patient_id: str
    study_id: str
    image_base64: str
    content_type: str
    metadata: Optional[dict] = {}

class AnalysisRequest(BaseModel):
    patient_id: str
    study_id: str
    image_base64: str
    content_type: str
    selected_models: Optional[List[str]] = ['yolov10', 'mask_rcnn', 'unet']
    features: Optional[List[str]] = ['detection', 'segmentation', 'xai', 'report']
    annotations: Optional[List[dict]] = []

class ExportRequest(BaseModel):
    analysis: dict
    format: str

class PACSFetchRequest(BaseModel):
    study_uid: str
