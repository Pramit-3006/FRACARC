import json
import os
from typing import Any, Dict, Optional

from pymongo import MongoClient
import psycopg


class AnalysisStore:
    def __init__(self):
        self.mongo_client: Optional[MongoClient] = None
        self.postgres_conn = None
        self.connect()

    def connect(self):
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://mongodb:27017')
        postgres_dsn = os.getenv('POSTGRES_DSN', 'postgresql://fracarc:fracarc_pass@postgres:5432/fracarcdb')
        try:
            self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            self.mongo_client.server_info()
        except Exception:
            self.mongo_client = None

        try:
            self.postgres_conn = psycopg.connect(postgres_dsn, autocommit=True)
        except Exception:
            self.postgres_conn = None

    def save_analysis(self, record: Dict[str, Any]) -> Dict[str, Any]:
        saved = {'mongo': False, 'postgres': False}
        if self.mongo_client:
            db = self.mongo_client.fracarc
            result = db.analyses.insert_one(record)
            saved['mongo'] = str(result.inserted_id)
        if self.postgres_conn:
            with self.postgres_conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO analyses (study_id, status, model_outputs, xai_outputs, report, metrics) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                    (
                        record.get('study_id'),
                        record.get('status'),
                        json.dumps(record.get('model_outputs', {})),
                        json.dumps(record.get('xai_outputs', {})),
                        json.dumps(record.get('report', {})),
                        json.dumps(record.get('metrics', {})),
                    ),
                )
                row = cur.fetchone()
                saved['postgres'] = row[0] if row else False
        return saved
