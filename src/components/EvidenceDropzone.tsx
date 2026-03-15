import { FileIcon, FileText, ImageIcon, Upload, Video, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export const MAX_EVIDENCE_FILE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = ['jpg', 'png', 'jpeg', 'mp4', 'pdf', 'doc', 'docx', 'zip'];
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png']);

function getFileExtension(fileName: string) {
  const segments = fileName.split('.');
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? '' : '';
}

function isAcceptedFile(file: File) {
  return ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name));
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function previewForFile(file: File) {
  const extension = getFileExtension(file.name);

  if (IMAGE_EXTENSIONS.has(extension)) {
    return { kind: 'image' as const, icon: ImageIcon };
  }

  if (extension === 'mp4') {
    return { kind: 'video' as const, icon: Video };
  }

  if (extension === 'pdf') {
    return { kind: 'pdf' as const, icon: FileText };
  }

  return { kind: 'file' as const, icon: FileIcon };
}

interface EvidenceDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
}

export function EvidenceDropzone({ files, onChange, error, disabled = false }: EvidenceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const previews = useMemo(
    () =>
      files.map((file) => {
        const preview = previewForFile(file);
        const previewUrl = preview.kind === 'image' || preview.kind === 'video' ? URL.createObjectURL(file) : null;
        return {
          file,
          previewUrl,
          ...preview
        };
      }),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [previews]);

  const mergeFiles = (incoming: File[]) => {
    const nextFiles = [...files];
    const seen = new Set(files.map((file) => `${file.name}-${file.size}-${file.lastModified}`));

    incoming.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!seen.has(key)) {
        seen.add(key);
        nextFiles.push(file);
      }
    });

    onChange(nextFiles);
  };

  const handleSelection = (incoming: File[]) => {
    mergeFiles(incoming);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelection(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleSelection(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-2xl border border-dashed p-5 text-center transition',
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
          disabled && 'cursor-not-allowed opacity-70'
        )}
      >
        <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">Drag and drop evidence files here</p>
        <p className="mt-1 text-xs text-muted-foreground">Accepted: jpg, png, jpeg, mp4, pdf, doc, docx, zip · max 20MB per file</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
            Choose Files
          </Button>
          <span className="text-xs text-muted-foreground">Multiple files supported</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          disabled={disabled}
          aria-label="Upload evidence files"
          title="Upload evidence files"
          accept=".jpg,.png,.jpeg,.mp4,.pdf,.doc,.docx,.zip"
          onChange={handleInputChange}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {files.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={disabled}
                  onClick={() => {
                    const nextFiles = [...files];
                    nextFiles.splice(index, 1);
                    onChange(nextFiles);
                  }}
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {item.kind === 'image' && item.previewUrl ? (
                <img src={item.previewUrl} alt={item.file.name} className="h-28 w-full rounded-lg object-cover" />
              ) : null}
              {item.kind === 'video' && item.previewUrl ? (
                <video src={item.previewUrl} controls className="h-28 w-full rounded-lg object-cover" />
              ) : null}
              {item.kind === 'pdf' ? (
                <div className="flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  PDF ready to upload
                </div>
              ) : null}
              {item.kind === 'file' ? (
                <div className="flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  File ready to upload
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function isAcceptedEvidenceFile(file: File) {
  return isAcceptedFile(file);
}