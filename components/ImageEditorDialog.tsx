import React, { useState, useRef } from 'react';
import { AppLanguage } from '../types';
import { editImage } from '../llmService';

interface ImageEditorDialogProps {
  language: AppLanguage;
  onClose: () => void;
}

export const ImageEditorDialog: React.FC<ImageEditorDialogProps> = ({ language, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    cs: {
      title: "Inteligentní úprava a rekonstrukce fotky",
      upload_desc: "Nahrajte fotografii. AI automaticky najde rozmazaná, začerněná nebo jinak skrytá místa a fotorealisticky je zrekonstruuje.",
      upload_btn: "Vybrat fotografii",
      processing: "Rekonstruuji obraz...",
      repair_btn: "Opravit obraz",
      download_btn: "Stáhnout výsledek",
      close: "Zavřít",
      error: "Při úpravě došlo k chybě: ",
    },
    en: {
      title: "Smart Photo Edit & Reconstruction",
      upload_desc: "Upload a photo. AI will automatically find blurred, blacked out, or obscured areas and photorealistically reconstruct them.",
      upload_btn: "Select Photo",
      processing: "Reconstructing image...",
      repair_btn: "Repair Image",
      download_btn: "Download Result",
      close: "Close",
      error: "Error during edit: ",
    }
  }[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRepair = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const base64Data = selectedImage.split(',')[1] || selectedImage;
      const prompt = "If there are any blacked out, censored, obscured, or blurred areas in this image, seamlessly and photorealistically inpaint and reconstruct those missing parts so they perfectly match the surrounding context, lighting, and style. Ensure the final image looks completely natural with no artificial artifacts or censoring.";
      const result = await editImage(base64Data, mimeType, prompt);
      setResultImage(result);
    } catch (err: any) {
      console.error("Image edit error", err);
      setError(err?.message || "Unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {t.title}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <p className="text-slate-400 text-sm text-center">
            {t.upload_desc}
          </p>

          {!selectedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-pink-500 cursor-pointer transition-colors bg-slate-900/30"
            >
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="font-medium">{t.upload_btn}</span>
            </div>
          )}

          {selectedImage && !resultImage && (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black flex justify-center">
                <img src={selectedImage} alt="Original" className="max-h-[50vh] w-auto object-contain" />
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => { setSelectedImage(null); setResultImage(null); }}
                  className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {t.upload_btn}
                </button>
                <button 
                  onClick={handleRepair}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      {t.repair_btn}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {resultImage && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-bold text-center">Původní</div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black flex justify-center h-64">
                    <img src={selectedImage!} alt="Original" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-widest text-pink-500 font-bold text-center">Zrekonstruováno</div>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.15)] bg-black flex justify-center h-64">
                    <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => { setSelectedImage(null); setResultImage(null); }}
                  className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                  Nová fotografie
                </button>
                <a 
                  href={resultImage} 
                  download="reconstructed_image.png"
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t.download_btn}
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
              {t.error} {error}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
};
