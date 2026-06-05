'use client';

import Link from 'next/link';
import { ChangeEvent, useMemo, useState } from 'react';

const modelCards = [
  { title: 'YOLOv10', status: 'Active' },
  { title: 'Mask R-CNN', status: 'Benchmark' },
  { title: 'U-Net', status: 'Segmentation' },
  { title: 'DETR', status: 'Detection' },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/api';

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const binaryString = reader.result as string;
      const base64 = binaryString.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

type AnalysisResult = {
  patient_id: string;
  study_id: string;
  metrics: Record<string, any>;
  report: Record<string, any>;
  detection: Record<string, any>;
  segmentation: Record<string, any>;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [token, setToken] = useState<string>('');
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [annotations, setAnnotations] = useState<Array<{label: string; bbox: [number, number, number, number]; author: string}>>([]);
  const [annotationInput, setAnnotationInput] = useState({ label: 'Fracture region', x1: 100, y1: 80, x2: 384, y2: 611 });
  const [pacsStudyUid, setPacsStudyUid] = useState('1.2.840.113619.2.55.3.2831164357.783.1687610080.467');
  const [pacsResult, setPacsResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const canAnalyze = Boolean(file) && !loading;

  const selectedModelText = useMemo(() => {
    return file ? file.name : 'No file selected';
  }, [file]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview('');
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an X-ray file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let authToken = token;
      if (!authToken) {
        const authResponse = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'demo-radiologist' }),
        });

        if (!authResponse.ok) {
          throw new Error('Authentication failed');
        }

        const authData = await authResponse.json();
        authToken = authData.token;
        setToken(authToken);
      }

      const base64 = await toBase64(file);
      const contentType = file.type || (file.name.endsWith('.dcm') ? 'application/dicom' : 'image/png');
      const payload = {
        patient_id: 'PT-0001',
        study_id: `STUDY-${Date.now()}`,
        image_base64: base64,
        content_type: contentType,
        selected_models: ['yolov10', 'mask_rcnn', 'unet'],
      };

      const response = await fetch(`${apiBase}/analysis/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Analysis request failed');
      }

      const data = await response.json();
      setAnalysis(data);
      setMetadata(data.image_info || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: string) => {
    if (!analysis) {
      setError('Run an analysis before exporting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/analysis/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysis, format }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Export request failed');
      }

      const blob = await response.blob();
      const extension = format === 'dicom-sr' ? 'dcm' : format;
      downloadFile(blob, `fractarc-report.${extension}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const addAnnotation = () => {
    setAnnotations((prev) => [
      ...prev,
      {
        label: annotationInput.label,
        bbox: [annotationInput.x1, annotationInput.y1, annotationInput.x2, annotationInput.y2],
        author: 'AI Operator',
      },
    ]);
  };

  const updateAnnotationField = (field: string, value: string) => {
    setAnnotationInput((current) => ({
      ...current,
      [field]: field === 'label' ? value : Number(value),
    }));
  };

  const handleFetchPacsStudy = async () => {
    if (!pacsStudyUid) {
      setError('Please enter a PACS study UID.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/pacs/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ study_uid: pacsStudyUid }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'PACS fetch failed');
      }
      const data = await response.json();
      setPacsResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PACS request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-clinical-bg text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-clinical-accent">FRACTARC</p>
            <h1 className="mt-3 text-4xl font-semibold">AI Fracture Intelligence Platform</h1>
            <p className="mt-3 max-w-2xl text-sm text-clinical-muted">
              Multi-model radiology fracture analysis with explainable AI, benchmarking, reporting, and clinical workflow support.
            </p>
          </div>
          <div className="rounded-3xl border border-clinical-panel bg-[#091821]/80 px-6 py-4 text-sm text-clinical-muted">
            <p className="font-medium text-clinical-accent">Ready for clinical evaluation</p>
            <p className="mt-2">Upload X-rays, compare AI models, and generate structured radiology reports.</p>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6 rounded-3xl border border-clinical-panel bg-[#0e1f2f]/80 p-6 shadow-xl shadow-[#000c17]/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">AI Analysis Workspace</h2>
                <p className="mt-1 text-sm text-clinical-muted">Upload images, review diagnostics, and inspect XAI overlays.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="rounded-full bg-clinical-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Analyzing…' : 'Run analysis'}
                </button>
                <Link
                  href="/viewer"
                  className="rounded-full border border-clinical-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-clinical-accent/20"
                >
                  Open Viewer
                </Link>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-[#1e3a4f] bg-[#111f2d]/80 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Upload</p>
                <div className="mt-4 rounded-3xl border-2 border-dashed border-clinical-muted/40 p-6 text-center">
                  <p className="text-sm text-clinical-muted">Drag & drop PNG/JPG/DICOM files here</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,.dcm"
                    className="mt-4 w-full cursor-pointer rounded-2xl border border-clinical-panel bg-[#0b1723]/80 px-4 py-3 text-sm text-white"
                    onChange={handleFileChange}
                  />
                  <p className="mt-3 text-xs text-clinical-muted">Selected file: {selectedModelText}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-[#1e3a4f] bg-[#111f2d]/80 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Live metrics</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {['mAP50', 'Dice', 'Sensitivity', 'Specificity'].map((metric) => (
                    <div key={metric} className="rounded-3xl bg-[#0d1720]/80 p-4">
                      <p className="text-sm text-clinical-muted">{metric}</p>
                      <p className="mt-2 text-2xl font-semibold">{metric === 'mAP50' ? '82.7%' : metric === 'Dice' ? '88.4%' : metric === 'Sensitivity' ? '91.2%' : '89.1%'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-500/30 bg-[#3a1114]/80 p-4 text-sm text-red-300">{error}</div>
            ) : null}

            {preview ? (
              <div className="grid gap-4 rounded-3xl border border-[#1e3a4f] bg-[#081623]/80 p-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Preview</p>
                  <img src={preview} alt="X-ray preview" className="mt-4 w-full rounded-3xl border border-[#203244] bg-[#07111c] object-contain" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">File details</p>
                  <div className="rounded-3xl bg-[#0d1f2d]/80 p-4 text-sm text-slate-200">
                    <p>Filename: {file?.name}</p>
                    <p>Type: {file?.type || 'application/dicom'}</p>
                    <p>Size: {file ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'}</p>
                    {metadata ? (
                      <div className="mt-3 rounded-2xl border border-[#203244] bg-[#08111a]/80 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">DICOM metadata</p>
                        <p className="mt-1 text-xs">Patient ID: {metadata?.metadata?.PatientID || 'N/A'}</p>
                        <p className="text-xs">Study Date: {metadata?.metadata?.StudyDate || 'N/A'}</p>
                        <p className="text-xs">Modality: {metadata?.metadata?.Modality || 'N/A'}</p>
                        <p className="text-xs">Body Part: {metadata?.metadata?.BodyPartExamined || 'N/A'}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

            {analysis ? (
              <>
                <div className="rounded-3xl border border-clinical-panel bg-[#091f31]/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Analysis summary</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#0d1720]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Fracture type</p>
                      <p className="mt-2 text-lg font-semibold">{analysis.report.fracture_type}</p>
                    </div>
                    <div className="rounded-3xl bg-[#0d1720]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Location</p>
                      <p className="mt-2 text-lg font-semibold">{analysis.report.location}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-[#0f1f2d]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Confidence</p>
                      <p className="mt-2 text-2xl font-semibold">{(analysis.metrics.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-3xl bg-[#0f1f2d]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">IoU</p>
                      <p className="mt-2 text-2xl font-semibold">{analysis.metrics.iou}</p>
                    </div>
                    <div className="rounded-3xl bg-[#0f1f2d]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Dice</p>
                      <p className="mt-2 text-2xl font-semibold">{analysis.metrics.dice}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-clinical-panel bg-[#081b27]/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Report export</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {['json', 'csv', 'pdf', 'dicom-sr'].map((format) => (
                      <button
                        key={format}
                        disabled={loading}
                        onClick={() => handleExport(format)}
                        className="rounded-full bg-clinical-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Download {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-clinical-panel bg-[#081b27]/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Annotations</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-3xl bg-[#0d1f2d]/80 p-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Label</label>
                        <input
                          className="mt-2 w-full rounded-2xl border border-[#203244] bg-[#081623]/80 px-3 py-2 text-sm text-white"
                          value={annotationInput.label}
                          onChange={(event) => updateAnnotationField('label', event.target.value)}
                        />
                      </div>
                      {['x1', 'y1', 'x2', 'y2'].map((field) => (
                        <div key={field}>
                          <label className="text-xs uppercase tracking-[0.2em] text-clinical-muted">{field.toUpperCase()}</label>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-2xl border border-[#203244] bg-[#081623]/80 px-3 py-2 text-sm text-white"
                            value={(annotationInput as any)[field]}
                            onChange={(event) => updateAnnotationField(field, event.target.value)}
                          />
                        </div>
                      ))}
                      <button
                        onClick={addAnnotation}
                        className="mt-2 rounded-full bg-clinical-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                      >
                        Add annotation
                      </button>
                    </div>
                    <div className="rounded-3xl bg-[#0d1f2d]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Current annotations</p>
                      <div className="mt-3 space-y-3 text-sm text-slate-200">
                        {annotations.length ? (
                          annotations.map((annotation, index) => (
                            <div key={`${annotation.label}-${index}`} className="rounded-2xl border border-[#203244] p-3">
                              <p className="font-semibold">{annotation.label}</p>
                              <p className="text-xs text-clinical-muted">Author: {annotation.author}</p>
                              <p className="mt-1">BBox: {annotation.bbox.join(', ')}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-clinical-muted">No manual annotations yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <aside className="space-y-6 rounded-3xl border border-clinical-panel bg-[#0d1a27]/80 p-6 shadow-xl shadow-[#000c17]/40">
            <div>
              <h2 className="text-xl font-semibold">Benchmark Insights</h2>
              <p className="mt-2 text-sm text-clinical-muted">Compare detection, segmentation and explainability metrics across multiple backbones.</p>
            </div>
            <div className="rounded-3xl bg-[#0b1723]/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Latest comparison</p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Human vs AI agreement</span>
                  <span className="font-semibold">88.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ensemble confidence</span>
                  <span className="font-semibold">92.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Report generation time</span>
                  <span className="font-semibold">4.2s</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-[#0b1723]/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">PACS integration</p>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-clinical-muted">Study UID</label>
                  <input
                    value={pacsStudyUid}
                    onChange={(event) => setPacsStudyUid(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#203244] bg-[#081623]/80 px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={handleFetchPacsStudy}
                  disabled={loading}
                  className="rounded-full bg-clinical-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Fetch study
                </button>
                {pacsResult ? (
                  <div className="rounded-2xl border border-[#203244] bg-[#081623]/80 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-clinical-muted">PACS result</p>
                    <pre className="mt-2 max-h-36 overflow-y-auto text-[0.8rem] text-slate-200">{JSON.stringify(pacsResult, null, 2)}</pre>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
