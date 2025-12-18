import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Search, LogOut, User, PanelLeftOpen, PanelLeftClose, Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/store';
import { ChatSession, getSessions, deleteSession, renameSession } from '../../services/chat';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface ChatSidebarProps {
    currentSessionId: number | null;
    onSelectSession: (id: number) => void;
    onNewChat: () => void;
    refreshTrigger?: number;
}

const ChatSidebar = ({ currentSessionId, onSelectSession, onNewChat, refreshTrigger = 0 }: ChatSidebarProps) => {
    const { user, logout, darkMode, toggleDarkMode } = useStore();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions', error);
        }
    };

    useEffect(() => {
        loadSessions();
    }, [currentSessionId, refreshTrigger]); // Reload when session changes or trigger fires

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteSession(id);
        if (currentSessionId === id) onNewChat();
        loadSessions();
    };

    const handleRename = async (e: React.MouseEvent, id: number, title: string) => {
        e.stopPropagation();
        setEditingId(id);
        setEditTitle(title);
    };

    const submitRename = async () => {
        if (editingId && editTitle) {
            await renameSession(editingId, editTitle);
            setEditingId(null);
            loadSessions();
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={clsx(
            "bg-[#f0f4f9] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-all duration-300 relative",
            collapsed ? "w-20" : "w-72"
        )}>
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md z-50 hover:text-primary-500 transition-transform hover:scale-110"
            >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Header */}
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className={clsx(
                        "flex items-center gap-2 bg-gradient-to-r from-[#2596be] to-[#1e85aa] hover:from-[#1e85aa] hover:to-[#186f8f] text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95",
                        collapsed ? "w-10 h-10 justify-center p-0" : "w-full px-4 py-3.5"
                    )}
                    title="New Chat"
                >
                    <Plus className="w-5 h-5" />
                    {!collapsed && <span className="font-semibold tracking-wide">New Chat</span>}
                </button>
            </div>

            {/* Search */}
            {!collapsed && (
                <div className="px-4 mb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#eaf1fb] dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2596be]/20 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                </div>
            )}

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-0.5">
                {filteredSessions.map(session => (
                    <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={clsx(
                            "group flex items-center gap-3 rounded-lg cursor-pointer transition-all",
                            currentSessionId === session.id
                                ? "bg-[#c2e7ff] dark:bg-blue-900/20 text-slate-900 dark:text-blue-400 font-medium"
                                : "hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
                            collapsed ? "justify-center p-2" : "px-3 py-2.5"
                        )}
                        title={collapsed ? session.title : undefined}
                    >
                        <MessageSquare className={clsx("w-4 h-4 shrink-0", currentSessionId === session.id ? "text-slate-700 dark:text-blue-400" : "text-slate-400")} />

                        {!collapsed && (
                            <>
                                {editingId === session.id ? (
                                    <input
                                        autoFocus
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={submitRename}
                                        onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 bg-white dark:bg-slate-700 px-2 py-1 rounded text-sm border border-blue-300 outline-none"
                                    />
                                ) : (
                                    <span className="flex-1 truncate text-sm">{session.title}</span>
                                )}

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleRename(e, session.id, session.title)}
                                        className="p-1 hover:text-[#2596be] dark:hover:text-blue-400"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, session.id)}
                                        className="p-1 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#f0f4f9] dark:bg-slate-900">
                {!collapsed ? (
                    <div className="flex flex-col gap-4">
                        {/* User Profile */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#c2e7ff] dark:bg-blue-900 text-[#001d35] dark:text-blue-300 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{user?.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={toggleDarkMode}
                                className="flex-1 flex items-center justify-center gap-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                <span>{darkMode ? 'Light' : 'Dark'}</span>
                            </button>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="flex-1 flex items-center justify-center gap-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="w-8 h-8 bg-[#c2e7ff] dark:bg-blue-900 text-[#001d35] dark:text-blue-300 rounded-full flex items-center justify-center" title={user?.name}>
                            <User className="w-4 h-4" />
                        </div>
                        <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-[#2596be] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
