import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadPdf } from '../../services/pdf';
import Header from '../../components/Shared/Header';
import Footer from '../../components/Shared/Footer';
import { Loader2, UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const UploadPdf = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            await uploadPdf(file);
            setSuccess(true);
            setTimeout(() => navigate('/staff'), 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Upload failed');
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="liquid-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <Header />

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex justify-center">
                <div className="glass-card w-full max-w-xl p-8 animate-in fade-in zoom-in duration-300">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">Upload New PDF</h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Upload successful! Redirecting...
                        </div>
                    )}

                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors bg-white/30">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-upload"
                        />

                        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                            {file ? (
                                <>
                                    <FileText className="w-16 h-16 text-primary-500 mb-4" />
                                    <p className="font-medium text-slate-700">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-16 h-16 text-slate-400 mb-4" />
                                    <p className="font-medium text-slate-700">Click to browse or drag file here</p>
                                    <p className="text-sm text-slate-500 mt-1">PDF files only</p>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={() => navigate('/staff')}
                            className="btn-secondary flex-1"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading || success}
                            className="btn-primary flex-1 flex justify-center items-center gap-2"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload PDF'}
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UploadPdf;
