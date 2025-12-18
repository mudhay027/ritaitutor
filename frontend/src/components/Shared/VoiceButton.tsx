import { Volume2, StopCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VoiceButtonProps {
    text: string;
}

const VoiceButton = ({ text }: VoiceButtonProps) => {
    const [speaking, setSpeaking] = useState(false);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => setSpeaking(false);
        setUtterance(u);

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [text]);

    const toggleSpeech = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
        } else {
            if (utterance) {
                window.speechSynthesis.speak(utterance);
                setSpeaking(true);
            }
        }
    };

    return (
        <button
            onClick={toggleSpeech}
            className="p-2 text-slate-400 hover:text-primary-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            title={speaking ? "Stop speaking" : "Read aloud"}
        >
            {speaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
    );
};

export default VoiceButton;
