import { useEffect, useState } from 'react';
import { getPdfs, deletePdf, renamePdf } from '../../services/pdf';
import PdfList from '../../components/Shared/PdfList';
import Header from '../../components/Shared/Header';
import Footer from '../../components/Shared/Footer';
import Modal from '../../components/Shared/Modal';
import { Loader2, Upload as UploadIcon, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagePdfs = () => {
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const fetchPdfs = async () => {
        setLoading(true);
        try {
            const data = await getPdfs();
            setPdfs(data);
        } catch (error) {
            console.error('Failed to fetch PDFs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPdfs();
    }, []);

    const handleDelete = async (filename: string) => {
        if (confirm(`Are you sure you want to delete ${filename}?`)) {
            await deletePdf(filename);
            fetchPdfs();
        }
    };

    const handleRenameClick = (filename: string) => {
        setSelectedPdf(filename);
        setNewName(filename);
        setRenameModalOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (selectedPdf && newName) {
            await renamePdf(selectedPdf, newName);
            setRenameModalOpen(false);
            fetchPdfs();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="liquid-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <Header />

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Staff Dashboard</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchPdfs}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link to="/staff/upload" className="btn-primary flex items-center gap-2">
                            <UploadIcon className="w-4 h-4" />
                            Upload New PDF
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : pdfs.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <p className="text-slate-500 text-lg mb-4">No PDFs uploaded yet.</p>
                        <Link to="/staff/upload" className="text-primary-600 hover:underline">Upload your first PDF</Link>
                    </div>
                ) : (
                    <PdfList
                        pdfs={pdfs}
                        onDelete={handleDelete}
                        onRename={handleRenameClick}
                        showActions={true}
                    />
                )}
            </main>

            <Footer />

            <Modal
                isOpen={renameModalOpen}
                onClose={() => setRenameModalOpen(false)}
                title="Rename PDF"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Filename</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="glass-input w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setRenameModalOpen(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRenameSubmit}
                            className="btn-primary"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ManagePdfs;
