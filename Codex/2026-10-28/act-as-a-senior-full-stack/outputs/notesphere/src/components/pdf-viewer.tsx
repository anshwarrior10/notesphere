"use client";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Maximize,
  Scan,
  LoaderCircle,
  Download,
} from "lucide-react";
export function PdfViewer({ id }: { id: string }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    box = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<any>(null),
    [page, setPage] = useState(1),
    [zoom, setZoom] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let cancelled = false,
      task: any;
    (async () => {
      try {
        const pdf = await import("pdfjs-dist");
        pdf.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = pdf.getDocument({
          url: `/api/notes/${id}/file`,
          withCredentials: true,
        });
        const d = await task.promise;
        if (!cancelled) setDoc(d);
      } catch {
        if (!cancelled) {
          setError(
            "The document could not be rendered. You can still download it.",
          );
          setBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [id]);
  useEffect(() => {
    if (!doc) return;
    let cancelled = false,
      render: any;
    setBusy(true);
    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const base = p.getViewport({ scale: 1 });
        const width = Math.max(260, (box.current?.clientWidth || 700) - 48);
        const scale = (width / base.width) * zoom;
        const viewport = p.getViewport({ scale });
        const c = canvas.current;
        if (!c) return;
        const ratio = window.devicePixelRatio || 1;
        c.width = viewport.width * ratio;
        c.height = viewport.height * ratio;
        c.style.width = `${viewport.width}px`;
        c.style.height = `${viewport.height}px`;
        render = p.render({
          canvasContext: c.getContext("2d"),
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        await render.promise;
      } catch (e: any) {
        if (e.name !== "RenderingCancelledException" && !cancelled)
          setError("Unable to display this page. Try downloading the PDF.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
      render?.cancel();
    };
  }, [doc, page, zoom]);
  return (
    <div className="pdf-viewer" ref={box}>
      <div className="pdf-toolbar">
        <div className="inline">
          <button
            className="icon-btn"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {page} <span className="muted">of {doc?.numPages || "—"}</span>
          </span>
          <button
            className="icon-btn"
            aria-label="Next page"
            disabled={!doc || page >= doc.numPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="inline">
          <button
            className="icon-btn"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((z) => z - 0.25)}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            className="icon-btn"
            aria-label="Zoom in"
            disabled={zoom >= 2.5}
            onClick={() => setZoom((z) => z + 0.25)}
          >
            <Plus size={16} />
          </button>
          <button
            className="icon-btn"
            aria-label="Fit width"
            onClick={() => setZoom(1)}
          >
            <Scan size={16} />
          </button>
          <button
            className="icon-btn"
            aria-label="Full screen"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else
                box.current
                  ?.requestFullscreen()
                  .catch(() =>
                    setError("Full screen is unavailable in this browser."),
                  );
            }}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
      <div className="pdf-canvas">
        {busy && (
          <div className="pdf-loading">
            <LoaderCircle className="spin" />
            Loading document…
          </div>
        )}
        {error ? (
          <div className="empty">
            <p>{error}</p>
            <a className="btn" href={`/api/notes/${id}/file?download=1`}>
              <Download size={16} />
              Download PDF
            </a>
          </div>
        ) : (
          <canvas ref={canvas} />
        )}
      </div>
    </div>
  );
}
