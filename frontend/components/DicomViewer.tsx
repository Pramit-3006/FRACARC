'use client';

import { useState } from 'react';
import dicomParser from 'dicom-parser';

type DicomMetadata = {
  patientName?: string;
  studyDate?: string;
  modality?: string;
  bodyPartExamined?: string;
  rows?: number;
  columns?: number;
};

type DicomViewerProps = {
  onFileLoaded?: (fileName: string, metadata: DicomMetadata, previewUrl: string | null) => void;
};

export function DicomViewer({ onFileLoaded }: DicomViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DicomMetadata>({});

  const parseDicomData = (arrayBuffer: ArrayBuffer) => {
    try {
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      return {
        patientName: dataSet.string('x00100010') || 'Unknown',
        studyDate: dataSet.string('x00080020') || 'Unknown',
        modality: dataSet.string('x00080060') || 'Unknown',
        bodyPartExamined: dataSet.string('x00180015') || 'Unknown',
        rows: dataSet.uint16('x00280010'),
        columns: dataSet.uint16('x00280011'),
      };
    } catch {
      return {};
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (!result || typeof result === 'string') return;

      const arrayBuffer = result as ArrayBuffer;
      const header = new Uint8Array(arrayBuffer.slice(128, 132));
      const isDicom = String.fromCharCode(...header) === 'DICM';

      if (isDicom) {
        const metadataResult = parseDicomData(arrayBuffer);
        setMetadata(metadataResult);
        setPreviewUrl(null);
        if (onFileLoaded) {
          onFileLoaded(file.name, metadataResult, null);
        }
      } else {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMetadata({});
        if (onFileLoaded) {
          onFileLoaded(file.name, {}, url);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="rounded-3xl border border-clinical-panel bg-[#09151f]/90 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">DICOM Viewer</p>
        <input
          type="file"
          accept="image/png,image/jpeg,.dcm"
          className="rounded-2xl border border-[#203244] bg-[#081623]/80 px-3 py-2 text-sm text-white"
          onChange={handleFileChange}
        />
      </div>
      {previewUrl ? (
        <img src={previewUrl} alt="DICOM preview" className="w-full rounded-3xl border border-[#203244] bg-[#081623]/80 object-contain" />
      ) : (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-[#203244] bg-[#081623]/20 text-sm text-clinical-muted">
          DICOM preview unavailable for native DICOM images. Upload a PNG/JPG for preview.
        </div>
      )}
      <div className="mt-4 rounded-3xl bg-[#0b1723]/80 p-4 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Study metadata</p>
        <p className="mt-2">Patient: {metadata.patientName || 'N/A'}</p>
        <p>Study date: {metadata.studyDate || 'N/A'}</p>
        <p>Modality: {metadata.modality || 'N/A'}</p>
        <p>Body part: {metadata.bodyPartExamined || 'N/A'}</p>
        <p>Dimensions: {metadata.rows || '-'} x {metadata.columns || '-'}</p>
      </div>
    </div>
  );
}
