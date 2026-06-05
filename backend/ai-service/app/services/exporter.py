import csv
import io
import json
from datetime import datetime
from typing import Any, Dict

from fpdf import FPDF
import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid


class ReportExporter:
    def create_json(self, report: Dict[str, Any]) -> str:
        return json.dumps(report, indent=2)

    def create_csv(self, report: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['field', 'value'])
        for key, value in report.items():
            if isinstance(value, (dict, list)):
                writer.writerow([key, json.dumps(value)])
            else:
                writer.writerow([key, value])
        return output.getvalue()

    def create_pdf(self, report: Dict[str, Any]) -> bytes:
        pdf = FPDF(orientation='P', unit='mm', format='A4')
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'FRACTARC Radiology Report', ln=True, align='C')
        pdf.ln(5)

        pdf.set_font('Helvetica', '', 11)
        for key, value in report.items():
            if isinstance(value, dict):
                pdf.set_font('Helvetica', 'B', 11)
                pdf.cell(0, 8, f'{key}:', ln=True)
                pdf.set_font('Helvetica', '', 10)
                for subkey, subvalue in value.items():
                    pdf.multi_cell(0, 6, f'  {subkey}: {subvalue}')
            else:
                pdf.cell(0, 6, f'{key}: {value}', ln=True)
        buffer = io.BytesIO()
        pdf.output(buffer)
        return buffer.getvalue()

    def create_dicom_sr(self, report: Dict[str, Any]) -> bytes:
        file_meta = Dataset()
        file_meta.MediaStorageSOPClassUID = pydicom.uid.BasicTextSRStorage
        file_meta.MediaStorageSOPInstanceUID = generate_uid()
        file_meta.TransferSyntaxUID = ExplicitVRLittleEndian

        ds = FileDataset('', {}, file_meta=file_meta, preamble=b'\0' * 128)
        ds.is_little_endian = True
        ds.is_implicit_VR = False

        ds.PatientName = report.get('patient_id', 'UNKNOWN')
        ds.PatientID = report.get('patient_id', 'UNKNOWN')
        ds.StudyInstanceUID = generate_uid()
        ds.SeriesInstanceUID = generate_uid()
        ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
        ds.SOPClassUID = file_meta.MediaStorageSOPClassUID
        ds.Modality = 'SR'
        ds.ContentDate = datetime.now().strftime('%Y%m%d')
        ds.ContentTime = datetime.now().strftime('%H%M%S')
        ds.CompletionFlag = 'COMPLETE'
        ds.VerificationFlag = 'UNVERIFIED'
        ds.ClinicalTrialSeriesID = 'FRACTARC'

        text = '\n'.join([f'{key}: {json.dumps(value) if isinstance(value, (dict, list)) else value}' for key, value in report.items()])
        ds.add_new((0x0040, 0xa730), 'SQ', [])
        ds.add_new((0x0040, 0xa160), 'UT', text)

        output = io.BytesIO()
        ds.save_as(output, write_like_original=False)
        return output.getvalue()
