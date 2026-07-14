import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function Dropzone({ onFile, disabled }: Props) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    onFile(f);
  }, [onFile]);

  return (
    <div
      className={clsx(
        'rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
        isOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:border-slate-400',
        disabled && 'opacity-50 pointer-events-none',
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        pickFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
      <p className="text-slate-700 font-medium">Drop a food photo here</p>
      <p className="text-slate-500 text-sm mt-1">or click to choose a file</p>
    </div>
  );
}
