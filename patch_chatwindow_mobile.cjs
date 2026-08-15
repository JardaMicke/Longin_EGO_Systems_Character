const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

if (!code.includes('onMenuClick?: () => void;')) {
  // Update interface
  code = code.replace(
    "interface ChatWindowProps {",
    "import { ImageViewer } from './ImageViewer';\n\ninterface ChatWindowProps {\n  onMenuClick?: () => void;"
  );

  // Update component signature
  code = code.replace(
    "export const ChatWindow: React.FC<ChatWindowProps> = ({ ",
    "export const ChatWindow: React.FC<ChatWindowProps> = ({ onMenuClick, "
  );

  // Add state
  code = code.replace(
    "const messagesEndRef = useRef<HTMLDivElement>(null);",
    "const messagesEndRef = useRef<HTMLDivElement>(null);\n  const [viewingImage, setViewingImage] = useState<string | null>(null);"
  );

  // Add hamburger button
  code = code.replace(
    '<div className="relative group cursor-pointer">',
    `<button onClick={onMenuClick} className="md:hidden p-2 -ml-4 mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>\n        <div className="relative group cursor-pointer">`
  );

  // Make images clickable and add cursor-pointer
  code = code.replace(
    '<img src={msg.content || undefined} alt="moment" className="w-full h-auto object-cover max-h-[600px]" />',
    '<img src={msg.content || undefined} alt="moment" onClick={() => msg.content && setViewingImage(msg.content)} className="w-full h-auto object-cover max-h-[600px] cursor-zoom-in" />'
  );

  // Render ImageViewer at the end of ChatWindow
  code = code.replace(
    '</form>\n    </div>',
    '</form>\n      {viewingImage && <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />}\n    </div>'
  );

  fs.writeFileSync('components/ChatWindow.tsx', code);
  console.log("ChatWindow.tsx patched for mobile & image viewer");
}
