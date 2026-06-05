import cv2
import numpy as np


class PreprocessingService:
    def normalize(self, image: np.ndarray) -> np.ndarray:
        if image.dtype != np.uint8:
            image = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
            return image.astype('uint8')
        return image

    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(image)

    def histogram_equalization(self, image: np.ndarray) -> np.ndarray:
        return cv2.equalizeHist(image)

    def adaptive_sharpen(self, image: np.ndarray) -> np.ndarray:
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
        return cv2.filter2D(image, -1, kernel)

    def edge_enhancement(self, image: np.ndarray) -> np.ndarray:
        edges = cv2.Canny(image, 50, 150)
        combined = cv2.addWeighted(image, 0.85, edges, 0.15, 0)
        return combined

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        normalized = self.normalize(image)
        clahe = self.apply_clahe(normalized)
        equalized = self.histogram_equalization(clahe)
        sharpened = self.adaptive_sharpen(equalized)
        return self.edge_enhancement(sharpened)
