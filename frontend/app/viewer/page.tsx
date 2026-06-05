'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnnotationCanvas } from '../../components/AnnotationCanvas';
import { DicomViewer } from '../../components/DicomViewer';

type Annotation = {
  label: string;
  bbox: [number, number, number, number];
  author: string;
};

export default function ViewerPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [dicomSummary, setDicomSummary] = useState<Record<string, any> | null>(null);

  return (
    <main className="min-h-screen bg-clinical-bg text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-clinical-accent">FRACTARC Viewer</p>
            <h1 className="mt-3 text-4xl font-semibold">DICOM & Annotation Workspace</h1>
            <p className="mt-3 max-w-2xl text-sm text-clinical-muted">
              Load imaging studies, inspect DICOM metadata, and create manual annotation overlays.
            </p>
          </div>
          <Link href="/" className="rounded-full bg-clinical-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
            Back to dashboard
          </Link>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
          <div className="space-y-6 rounded-3xl border border-clinical-panel bg-[#0e1f2f]/80 p-6 shadow-xl shadow-[#000c17]/40">
            <DicomViewer
              onFileLoaded={(fileName, metadata, previewUrl) => {
                setDicomSummary({ fileName, metadata });
                if (previewUrl) {
                  setImageSrc(previewUrl);
                }
              }}
            />
            <AnnotationCanvas imageSrc={imageSrc} annotations={annotations} onChange={setAnnotations} />
          </div>

          <aside className="space-y-6 rounded-3xl border border-clinical-panel bg-[#0d1a27]/80 p-6 shadow-xl shadow-[#000c17]/40">
            <div>
              <h2 className="text-xl font-semibold">Annotation details</h2>
              <p className="mt-2 text-sm text-clinical-muted">Review annotations and manual findings before exporting.</p>
            </div>
            <div className="rounded-3xl bg-[#0b1723]/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Current source</p>
              <div className="mt-4 text-sm text-slate-200">
                <p>Image loaded: {imageSrc ? 'Yes' : 'No'}</p>
                <p>Annotations: {annotations.length}</p>
                <p>File: {dicomSummary?.fileName || 'N/A'}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-[#0b1723]/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">DICOM metadata</p>
              <div className="mt-4 text-sm text-slate-200">
                {dicomSummary?.metadata ? (
                  Object.entries(dicomSummary.metadata).map(([key, value]) => (
                    <p key={key}>
                      {key}: {value}
                    </p>
                  ))
                ) : (
                  <p className="text-clinical-muted">No DICOM metadata loaded</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
