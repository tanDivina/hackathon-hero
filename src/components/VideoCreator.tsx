import React, { useState, useEffect, useRef } from 'react';
import {
  Film, Music, Video, Sparkles, Cpu, Image as ImageIcon,
  Mic, Palette, Wand2, Download,
  Play, Pause, Type, MoveVertical, FlipHorizontal, Maximize2, X
} from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoCreatorProps {
  isPro: boolean;
  projectId?: string;
  onUpgradeClick?: () => void;
  pitchScript?: {
    problem: string;
    solution: string;
    traction: string;
    script_type?: 'pitch' | 'demo';
    requirements?: string;
    tools?: string;
    realworld_use?: string;
  };
}

export const VideoCreator: React.FC<VideoCreatorProps> = ({ isPro, projectId, onUpgradeClick, pitchScript }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const [logoFile, setLogoFile] = useState<string>('');
  const [audioFile, setAudioFile] = useState<string>('');
  const [logoPosition, setLogoPosition] = useState<string>('top-right');
  const [logoSize, setLogoSize] = useState<number>(150);
  const [audioVolume, setAudioVolume] = useState<number>(0.3);

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState<number>(180);
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('webm');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);

  const [scrollSpeed, setScrollSpeed] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(42);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [enableAI, setEnableAI] = useState(false);
  const [bgMode, setBgMode] = useState<'blur' | 'image'>('blur');
  const [virtualBgImage, setVirtualBgImage] = useState<HTMLImageElement | null>(null);
  const [videoFilter, setVideoFilter] = useState<'none' | 'cinematic' | 'noir' | 'warm'>('none');
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const teleprompterRef = useRef<HTMLDivElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const bgAudioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (projectId) loadSavedAssets();
    return () => cleanupResources();
  }, [projectId]);

  useEffect(() => {
    if (isExpanded) {
      startCamera();
      const loop = () => {
        drawFrame();
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } else {
      cleanupResources();
    }
  }, [isExpanded, videoFilter, enableAI, bgMode, logoPosition, logoSize]);

  useEffect(() => {
    const scrollLoop = () => {
      if (isRecording && !isPaused && teleprompterRef.current) {
        teleprompterRef.current.scrollTop += (scrollSpeed * 0.5);
      }
      scrollFrameRef.current = requestAnimationFrame(scrollLoop);
    };
    if (isRecording) scrollFrameRef.current = requestAnimationFrame(scrollLoop);
    return () => { if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current); };
  }, [isRecording, isPaused, scrollSpeed]);

  const cleanupResources = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const loadSavedAssets = async () => {
    if (!projectId) return;
    const assets = await databaseService.getVideoAssets(projectId);
    if (assets) {
      setLogoFile(assets.logo_url);
      setAudioFile(assets.audio_url);
      setLogoPosition(assets.logo_position);
      setLogoSize(assets.logo_size);
      setAudioVolume(assets.audio_volume);
      if (assets.logo_url) {
        const img = new Image();
        img.src = assets.logo_url;
        img.crossOrigin = "anonymous";
        logoImageRef.current = img;
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setupAudioContext(stream);
    } catch (e) {
      console.error("Camera Error:", e);
      alert("Camera access denied. Please check permissions.");
    }
  };

  const setupAudioContext = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;
    const dest = ctx.createMediaStreamDestination();
    const mic = ctx.createMediaStreamSource(stream);
    mic.connect(dest);

    if (audioFile && bgAudioElementRef.current) {
      const music = ctx.createMediaElementSource(bgAudioElementRef.current);
      const gain = ctx.createGain();
      gain.gain.value = audioVolume;
      music.connect(gain);
      gain.connect(dest);
      gain.connect(ctx.destination);
    }
    return dest.stream.getAudioTracks();
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    if (enableAI && bgMode === 'image' && virtualBgImage) {
        const scale = Math.max(canvas.width / virtualBgImage.width, canvas.height / virtualBgImage.height);
        const x = (canvas.width / 2) - (virtualBgImage.width / 2) * scale;
        const y = (canvas.height / 2) - (virtualBgImage.height / 2) * scale;
        ctx.drawImage(virtualBgImage, x, y, virtualBgImage.width * scale, virtualBgImage.height * scale);
    } else {
        switch (videoFilter) {
            case 'cinematic': ctx.filter = 'contrast(1.1) saturate(1.2)'; break;
            case 'noir': ctx.filter = 'grayscale(1) contrast(1.2)'; break;
            case 'warm': ctx.filter = 'sepia(0.2)'; break;
            default: ctx.filter = 'none';
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    if (logoImageRef.current && logoImageRef.current.complete) {
        const size = logoSize;
        let x = 20, y = 20;
        if (logoPosition.includes('right')) x = canvas.width - size - 40;
        if (logoPosition.includes('center')) x = (canvas.width - size) / 2;
        if (logoPosition.includes('bottom')) y = canvas.height - size - 40;
        if (logoPosition === 'center') y = (canvas.height - size) / 2;
        ctx.drawImage(logoImageRef.current, x, y, size, size);
    }
  };

  const handleGenerateLogo = async () => {
    if (!pitchScript?.problem) return alert("Script required!");
    setIsGeneratingLogo(true);
    try {
      const contextPrompt = `A startup solving: "${pitchScript.problem.substring(0, 50)}..."`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ prompt: contextPrompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setLogoFile(data.url);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = data.url;
      img.onload = () => { logoImageRef.current = img; };
    } catch (e) {
      console.error(e);
      alert("Logo generation failed.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const startRecording = () => {
    setCountdown(3);
    const interval = setInterval(() => {
        setCountdown(prev => {
            if (prev === 1) {
                clearInterval(interval);
                beginMediaRecorder();
                return null;
            }
            return prev ? prev - 1 : null;
        });
    }, 1000);
  };

  const beginMediaRecorder = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const mixedTracks = stream.getAudioTracks();

    const canvasStream = canvasRef.current.captureStream(30);
    mixedTracks.forEach(t => canvasStream.addTrack(t));

    const recorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 3000000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => processVideo(new Blob(chunks, { type: 'video/webm' }));

    mediaRecorderRef.current = recorder;
    recorder.start(1000);

    setIsRecording(true);
    startTimeRef.current = Date.now();

    if (audioFile && bgAudioElementRef.current) {
        bgAudioElementRef.current.currentTime = 0;
        bgAudioElementRef.current.play();
    }

    timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const rem = Math.max(0, 180 - elapsed);
        setTimeLeftDisplay(rem);
        if (rem === 0) stopRecording();
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (bgAudioElementRef.current) bgAudioElementRef.current.pause();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const processVideo = async (blob: Blob) => {
    if (outputFormat === 'mp4') {
        setIsConverting(true);
        try {
            if (!ffmpegRef.current) {
                const ffmpeg = new FFmpeg();
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
                ffmpegRef.current = ffmpeg;
            }
            const ffmpeg = ffmpegRef.current;
            ffmpeg.on('progress', ({ progress }) => setConversionProgress(Math.round(progress * 100)));
            await ffmpeg.writeFile('input.webm', await fetchFile(blob));
            await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'copy', 'output.mp4']);
            const data = await ffmpeg.readFile('output.mp4');
            download(new Blob([data], { type: 'video/mp4' }), 'mp4');
            await ffmpeg.deleteFile('input.webm');
            await ffmpeg.deleteFile('output.mp4');
        } catch (e) {
            console.error(e);
            alert("MP4 conversion failed (security/browser limitation). Downloading WebM.");
            download(blob, 'webm');
        } finally {
            setIsConverting(false);
        }
    } else {
        download(blob, 'webm');
    }
  };

  const download = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-${Date.now()}.${ext}`;
    a.click();
  };

  const sections = (pitchScript && pitchScript.problem) ? (
    pitchScript.script_type === 'demo' ? [
      { title: 'PROBLEM', text: pitchScript.problem },
      { title: 'SOLUTION', text: pitchScript.solution },
      { title: 'TRACTION', text: pitchScript.traction },
    ] : [
      { title: 'PROBLEM', text: pitchScript.problem },
      { title: 'SOLUTION', text: pitchScript.solution },
      { title: 'TRACTION', text: pitchScript.traction },
    ]
  ) : [
    { title: 'READY', text: 'Script will appear here.' },
    { title: 'SCROLL', text: 'Text scrolls when recording starts.' }
  ];

  return (
    <CyberCard
      icon={<Film size={32} strokeWidth={1.5} />}
      title="Video Creator Studio"
      description="Record professional pitch videos with AI tools."
      badge={isPro ? 'STUDIO UNLOCKED' : 'PRO LOCKED'}
    >
      <audio ref={bgAudioElementRef} src={audioFile} loop crossOrigin="anonymous" />

      {!isPro ? (
        <div className="text-center py-8">
           <p className="text-gray-400 mb-4">Upgrade to access the Video Creator Studio.</p>
           <button onClick={onUpgradeClick} className="bg-accent-yellow text-black px-6 py-2 font-bold hover:bg-white">UPGRADE TO PRO</button>
        </div>
      ) : (
        <>
          {!isExpanded && (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg">
               <Film size={48} className="mx-auto text-gray-700 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Ready to Record?</h3>
               <p className="text-gray-400 mb-6 max-w-md mx-auto">Open the full-screen studio to access the teleprompter, AI background, and recording tools.</p>
               <button
                 onClick={() => setIsExpanded(true)}
                 className="bg-accent-yellow text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all flex items-center justify-center gap-2 mx-auto"
               >
                 <Maximize2 size={20} /> OPEN STUDIO MODE
               </button>
            </div>
          )}

          {isExpanded && (
            <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">

               <div className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6 backdrop-blur">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 text-accent-yellow font-bold">
                        <Film size={20} /> STUDIO
                     </div>
                     {isRecording && (
                       <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1 rounded text-red-500 font-mono text-sm border border-red-900">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          REC {Math.floor(timeLeftDisplay/60)}:{(timeLeftDisplay%60).toString().padStart(2,'0')}
                       </div>
                     )}
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-black px-3 py-1 rounded border border-gray-800">
                        <span className="text-xs text-gray-500 font-mono">SCROLL</span>
                        <input type="range" min="1" max="8" step="0.5" value={scrollSpeed} onChange={e=>setScrollSpeed(Number(e.target.value))} className="w-16 accent-accent-yellow h-1 bg-gray-700 rounded-lg appearance-none"/>
                     </div>
                     <div className="flex items-center gap-2 bg-black px-3 py-1 rounded border border-gray-800">
                        <span className="text-xs text-gray-500 font-mono">SIZE</span>
                        <input type="range" min="20" max="80" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} className="w-16 accent-accent-yellow h-1 bg-gray-700 rounded-lg appearance-none"/>
                     </div>
                     <button onClick={()=>setIsExpanded(false)} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors">
                        <X size={20}/>
                     </button>
                  </div>
               </div>

               <div className="flex-1 relative overflow-hidden flex">

                  <div className="w-64 bg-black border-r border-gray-800 p-4 space-y-6 overflow-y-auto hidden md:block z-20">
                     <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-mono flex items-center gap-2"><Sparkles size={12}/> BRANDING</label>
                        <button
                          onClick={handleGenerateLogo}
                          disabled={isGeneratingLogo}
                          className="w-full bg-blue-900/30 border border-blue-900 text-blue-400 text-xs py-2 rounded hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
                        >
                           {isGeneratingLogo ? <Sparkles className="animate-spin" size={12}/> : <Wand2 size={12}/>} GENERATE LOGO
                        </button>
                        <input type="file" onChange={e=>{
                            const r = new FileReader(); r.onload=ev=>{
                               setLogoFile(ev.target?.result as string);
                               const i = new Image(); i.src = ev.target?.result as string; i.onload=()=>logoImageRef.current=i;
                            };
                            if(e.target.files?.[0]) r.readAsDataURL(e.target.files[0]);
                        }} className="text-xs text-gray-500 w-full"/>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-mono flex items-center gap-2"><Palette size={12}/> FILTERS</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['none','cinematic','noir','warm'].map(f=>(
                              <button key={f} onClick={()=>setVideoFilter(f as any)} className={`text-[10px] uppercase p-1 border rounded ${videoFilter===f?'border-accent-yellow text-accent-yellow':'border-gray-800 text-gray-500'}`}>{f}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-mono">EXPORT</label>
                        <div className="flex gap-2">
                           <button onClick={()=>setOutputFormat('webm')} className={`flex-1 text-[10px] border rounded py-1 ${outputFormat==='webm'?'border-accent-yellow bg-accent-yellow/10':'border-gray-800'}`}>WEBM</button>
                           <button onClick={()=>setOutputFormat('mp4')} className={`flex-1 text-[10px] border rounded py-1 ${outputFormat==='mp4'?'border-accent-yellow bg-accent-yellow/10':'border-gray-800'}`}>MP4</button>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 relative bg-black flex items-center justify-center">
                     <canvas ref={canvasRef} className="max-w-full max-h-full aspect-video shadow-2xl bg-gray-900" />

                     <video ref={videoRef} className="hidden" playsInline muted autoPlay />

                     <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center max-w-[80%] mx-auto">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/50 to-transparent z-10" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                        <div
                          ref={teleprompterRef}
                          className="w-full h-full overflow-y-auto no-scrollbar text-center relative"
                          style={{
                              transform: isMirrored ? 'scaleX(-1)' : 'none',
                              scrollBehavior: 'auto'
                          }}
                        >
                           <div style={{ paddingTop: '40vh', paddingBottom: '50vh' }}>
                              {sections.map((section, idx) => (
                                 <div key={idx} className="mb-32">
                                    <h3 className="text-accent-yellow text-sm font-mono mb-2 uppercase tracking-widest">{section.title}</h3>
                                    <p
                                      className="font-bold text-white leading-relaxed drop-shadow-[0_4px_4px_rgba(0,0,0,1)] px-4 py-2 bg-black/40 rounded-xl backdrop-blur-[2px]"
                                      style={{ fontSize: `${fontSize}px` }}
                                    >
                                       {section.text}
                                    </p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="absolute top-[35%] w-full border-t border-red-500/30 border-dashed flex justify-end">
                           <span className="text-[10px] text-red-500 bg-black/50 px-1">EYE LEVEL</span>
                        </div>
                     </div>

                     {countdown !== null && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                           <div className="text-9xl font-black text-accent-yellow animate-bounce">{countdown}</div>
                        </div>
                     )}

                     {isConverting && (
                        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-4">
                           <Download className="text-accent-yellow animate-bounce" size={48} />
                           <div className="text-xl font-bold text-white">Finalizing Video...</div>
                           <div className="w-64 h-2 bg-gray-800 rounded-full"><div className="h-full bg-accent-yellow transition-all duration-300" style={{width: `${conversionProgress}%`}}/></div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="h-20 bg-black border-t border-gray-800 flex items-center justify-center gap-4">
                  {!isRecording ? (
                     <button
                       onClick={startRecording}
                       className="bg-accent-yellow hover:bg-white text-black px-12 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all transform hover:scale-105 flex items-center gap-2"
                     >
                        <div className="w-4 h-4 bg-red-600 rounded-full" /> START RECORDING
                     </button>
                  ) : (
                     <div className="flex items-center gap-4">
                        <button onClick={()=>setIsPaused(!isPaused)} className="bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700">
                           {isPaused ? <Play size={24}/> : <Pause size={24}/>}
                        </button>
                        <button onClick={stopRecording} className="bg-red-600 text-white px-12 py-3 rounded-full font-bold text-lg hover:bg-red-700 shadow-lg">
                           STOP & SAVE
                        </button>
                     </div>
                  )}
               </div>
            </div>
          )}
        </>
      )}
    </CyberCard>
  );
};
