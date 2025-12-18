import { FileText, Trash2, Edit2, Download } from 'lucide-react';

interface Pdf {
    filename: string;
    size: number;
    uploadedAt: string;
    uploader: string;
}

interface PdfListProps {
    pdfs: Pdf[];
    onDelete?: (filename: string) => void;
    onRename?: (filename: string) => void;
    showActions?: boolean;
}

const PdfList = ({ pdfs, onDelete, onRename, showActions = false }: PdfListProps) => {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pdfs.map((pdf) => (
                <div key={pdf.filename} className="glass-card p-4 flex flex-col justify-between hover:shadow-2xl transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 truncate max-w-[150px]" title={pdf.filename}>
                                    {pdf.filename}
                                </h3>
                                <p className="text-xs text-slate-500">{formatSize(pdf.size)} • {new Date(pdf.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {showActions && (
                        <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => onRename?.(pdf.filename)}
                                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Rename"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <a
                                href={`http://localhost:5000/api/pdf/${pdf.filename}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => onDelete?.(pdf.filename)}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PdfList;
