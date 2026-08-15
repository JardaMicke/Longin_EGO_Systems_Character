const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

// Add isRecording state
code = code.replace(
  "const [input, setInput] = useState('');",
  "const [input, setInput] = useState('');\n  const [isRecording, setIsRecording] = useState(false);\n  const recognitionRef = useRef<any>(null);"
);

// Add start/stop recording function
const voiceFunctions = `
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'cs' ? 'cs-CZ' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(prev => {
           // We might want to just set it or append it. Setting is safer for interim.
           // However, for interim results it's better to maintain a separate state or just overwrite.
           return currentTranscript;
        });
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setInput(''); // clear before starting
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };
`;

code = code.replace(
  'const handleSubmit = (e: React.FormEvent) => {',
  voiceFunctions + '\n  const handleSubmit = (e: React.FormEvent) => {'
);

// Add microphone button
const micButton = `
              <button
                type="button"
                onClick={toggleRecording}
                className={\`w-14 h-14 mr-2 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 \${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}\`}
                title="Voice Input"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button
                type="submit"
`;

code = code.replace(
  '<button\n                type="submit"',
  micButton
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched with speech recognition");
