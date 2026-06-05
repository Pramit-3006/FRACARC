import base64
import io
from typing import Any, Dict, Optional, Tuple

import numpy as np
from PIL import Image
import pydicom


def normalize_uint8(image: np.ndarray) -> np.ndarray:
    image = image.astype('float32')
    image -= image.min()
    image /= max(image.max(), 1.0)
    image *= 255.0
    return image.astype('uint8')


class ImageryService:
    def decode_image(self, image_base64: str, content_type: str) -> Tuple[np.ndarray, Optional[Dict[str, Any]]]:
        raw_bytes = base64.b64decode(image_base64)
        if content_type.lower().endswith('dicom') or content_type.lower().endswith('.dcm') or b'DICM' in raw_bytes[:132]:
            dataset = pydicom.dcmread(io.BytesIO(raw_bytes), force=True)
            pixel_array = dataset.pixel_array
            if pixel_array.dtype != 'uint8':
                pixel_array = normalize_uint8(pixel_array)
            if getattr(dataset, 'PhotometricInterpretation', '').upper() == 'MONOCHROME1':
                pixel_array = np.max(pixel_array) - pixel_array
            return pixel_array, {'dicom': True, 'metadata': self.extract_dicom_metadata(dataset)}
        image = Image.open(io.BytesIO(raw_bytes)).convert('L')
        return np.array(image), {'dicom': False}

    def encode_png(self, image: np.ndarray) -> str:
        output = io.BytesIO()
        Image.fromarray(image).save(output, format='PNG')
        return base64.b64encode(output.getvalue()).decode('utf-8')

    def extract_dicom_metadata(self, dataset: Any) -> Dict[str, Any]:
        return {
            'PatientID': getattr(dataset, 'PatientID', None),
            'StudyDate': getattr(dataset, 'StudyDate', None),
            'Modality': getattr(dataset, 'Modality', None),
            'BodyPartExamined': getattr(dataset, 'BodyPartExamined', None),
        }
