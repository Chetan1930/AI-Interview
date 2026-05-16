'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResumeUploadProps {
  onTextExtracted: (text: string) => void;
}

export function ResumeUpload({ onTextExtracted }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const extractText = async (file: File) => {
    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        onTextExtracted(text);
      } else {
        const text = await file.text();
        onTextExtracted(text);
      }
      setDone(true);
      toast.success('Resume parsed successfully');
    } catch (e) {
      toast.error('Failed to parse PDF. Try a text file or paste your resume.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setDone(false);
      await extractText(accepted[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    multiple: false,
  });

  const reset = () => {
    setFile(null);
    setDone(false);
    onTextExtracted('');
  };

  return (
    <div>
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              isDragActive ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Upload className={cn('h-5 w-5', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click — PDF or TXT, max 5MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            done ? 'bg-emerald-500/10' : 'bg-muted'
          )}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : done ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Parsing...' : done ? 'Parsed successfully' : 'Ready'}
            </p>
          </div>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
