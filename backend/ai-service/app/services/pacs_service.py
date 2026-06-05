import os
from typing import Any, Dict, Optional

import requests


class PACSService:
    def __init__(self):
        self.pacs_url = os.getenv('PACS_ENDPOINT', 'http://pacs.example.com')

    def check_connection(self) -> Dict[str, Any]:
        try:
            response = requests.get(self.pacs_url, timeout=5)
            return {'reachable': True, 'status_code': response.status_code}
        except Exception as exc:
            return {'reachable': False, 'error': str(exc)}

    def fetch_study(self, study_uid: str) -> Dict[str, Any]:
        return {
            'study_uid': study_uid,
            'source': self.pacs_url,
            'status': 'stubbed',
            'message': 'PACS integration placeholder. Use DICOMweb/WADO service to fetch actual studies.',
        }
