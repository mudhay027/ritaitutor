import { User, Bot, FileText, Copy, Edit2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface ChatBubbleProps {
    message: string;
    isUser: boolean;
    sources?: string[];
    onEdit?: (text: string) => void;
}

const ChatBubble = ({ message, isUser, sources, onEdit }: ChatBubbleProps) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message);

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveEdit = () => {
        if (onEdit && editText.trim() !== message) {
            onEdit(editText);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(message);
        setIsEditing(false);
    };

    return (
        <div className={clsx("flex gap-4 mb-6 group", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isUser ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-slate-700"
            )}>
                {isUser ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>

            <div className={clsx(
                "max-w-[80%] rounded-2xl p-4 shadow-sm relative",
                isUser ? "bg-primary-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none text-slate-800 dark:text-slate-200"
            )}>
                {sources && sources.length > 0 && (
                    <details className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 group/source">
                        <summary className="font-semibold cursor-pointer list-none flex items-center gap-1 hover:text-primary-600 transition-colors">
                            <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Sources ({sources.length})
                            </span>
                            <span className="group-open/source:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-2 flex flex-wrap gap-2 pl-2">
                            {sources.map((s, i) => (
                                <span key={i} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    <FileText className="w-3 h-3" /> {s}
                                </span>
                            ))}
                        </div>
                    </details>
                )}

                {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[300px]">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-white/10 text-white p-2 rounded border border-white/20 focus:outline-none focus:border-white/40 resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 text-sm bg-white text-primary-600 font-medium rounded hover:bg-slate-100"
                            >
                                Save & Submit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {message}
                    </div>
                )}

                {/* Actions */}
                {!isEditing && (
                    <div className={clsx(
                        "absolute -bottom-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                        isUser ? "right-0" : "left-0"
                    )}>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 text-slate-400 hover:text-primary-500 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                            title="Copy"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {isUser && onEdit && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-slate-400 hover:text-primary-500 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
