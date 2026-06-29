import { useState, useRef, useCallback } from "react";
import { X, ImagePlus } from "lucide-react";
import { cn } from "~/lib/utils";

export type PhotoPickerProps = {
  max?: number;
  /** Tailwind classes for the add-button border/text colour when empty */
  className?: string;
};

export function PhotoPicker({ max = 5, className }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);

  const syncFiles = useCallback((files: File[]) => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []).slice(0, max - previews.length);
    const next = [
      ...previews,
      ...incoming.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    ].slice(0, max);
    setPreviews(next);
    const allFiles = Array.from(inputRef.current?.files ?? []);
    syncFiles([...allFiles.slice(0, previews.length), ...incoming].slice(0, max));
  };

  const remove = (idx: number) => {
    URL.revokeObjectURL(previews[idx].url);
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    const files = Array.from(inputRef.current?.files ?? []);
    syncFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        name="images"
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        aria-label="Upload photos"
      />
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={p.url} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${p.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {previews.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full h-10 rounded-lg border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors",
            "border-border text-muted-foreground hover:border-primary hover:text-primary",
            className,
          )}
        >
          <ImagePlus size={16} />
          {previews.length === 0 ? "Add photos" : `Add more (${previews.length}/${max})`}
        </button>
      )}
    </div>
  );
}
