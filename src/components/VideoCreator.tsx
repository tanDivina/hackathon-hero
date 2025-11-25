import React, { useState, useEffect, useRef } from 'react';
import {
  Film, Music, Video, Sparkles, Cpu, Image as ImageIcon,
  Mic, Palette, Wand2, Download,
  Play, Pause, Type, MoveVertical, FlipHorizontal, AlertCircle
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
  const [logoFile, setLogoFile] = useState<string>('');
  const [audioFile, setAudioFile] = useState<string>('');
  const [logoPosition, setLogoPosition] = useState<string>('top-right');
  const [logoSize, setLogoSize] = useState<number>(150);
  const [audioVolume, setAudioVolume] = useState<number>(0.3);

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState<number>(180);
  const [showPreview, setShowPreview] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('webm');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);

  const [scrollSpeed, setScrollSpeed] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(32);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPrompterControls, setShowPrompterControls] = useState(true);

  const [enableAI, setEnableAI] = useState(false);
  const [bgMode, setBgMode] = useState<'blur' | 'image'>('blur');
  const [virtualBgImage, setVirtualBgImage] = useState<HTMLImageElement | null>(null);
  const [videoFilter, setVideoFilter] = useState<'none' | 'cinematic' | 'noir' | 'warm'>('none');
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const teleprompterRef = useRef<HTMLDivElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioVisualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const visualizerFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const bgAudioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (projectId) loadSavedAssets();
    else resetAssets();
    return () => cleanupResources();
  }, [projectId]);

  useEffect(() => {
    const scrollLoop = () => {
      if (isRecording && !isPaused && teleprompterRef.current) {
        const pixelsPerFrame = scrollSpeed * 0.4;
        teleprompterRef.current.scrollTop += pixelsPerFrame;
      }
      scrollFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    if (isRecording) {
      scrollFrameRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    }

    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [isRecording, isPaused, scrollSpeed]);

  const cleanupResources = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (visualizerFrameRef.current) cancelAnimationFrame(visualizerFrameRef.current);
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

  const resetAssets = () => {
    setLogoFile(''); setAudioFile(''); setLogoPosition('top-right'); setLogoSize(150); setAudioVolume(0.3);
  };

  const handleGenerateLogo = async () => {
    if (!pitchScript?.problem) {
      alert("Please generate a pitch script first!");
      return;
    }
    setIsGeneratingLogo(true);
    try {
      const contextPrompt = `A startup solving: "${pitchScript.problem.substring(0, 100)}..." using: "${pitchScript.solution.substring(0, 50)}..."`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ prompt: contextPrompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      setLogoFile(data.url);
      const img = new Image();
      img.src = data.url;
      img.crossOrigin = "anonymous";
      img.onload = () => { logoImageRef.current = img; };
    } catch (error) {
      console.error("Logo Gen Error:", error);
      alert("Failed to generate logo. Ensure your API Key is valid and supports image generation.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const setupAudioContext = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;

    const micSource = ctx.createMediaStreamSource(stream);
    micSource.connect(analyser);

    const destination = ctx.createMediaStreamDestination();
    micSource.connect(destination);

    if (audioFile && bgAudioElementRef.current) {
      const musicSource = ctx.createMediaElementSource(bgAudioElementRef.current);
      const gainNode = ctx.createGain();
      gainNode.gain.value = audioVolume;
      musicSource.connect(gainNode);
      gainNode.connect(destination);
      gainNode.connect(ctx.destination);
    }
    startVisualizerLoop(analyser);
    return destination.stream.getAudioTracks();
  };

  const startVisualizerLoop = (analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      const canvas = audioVisualizerCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      visualizerFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${100 + (barHeight/canvas.height)*60}, 100%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        await previewVideoRef.current.play();
      }
      setupAudioContext(stream);
      setShowPreview(true);
      startRenderingLoop();
    } catch (e) {
      console.error(e);
      alert("Camera access denied. Please allow permissions.");
    }
  };

  const startRenderingLoop = () => {
    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      drawStandardFrame();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const applyFilters = (ctx: CanvasRenderingContext2D) => {
    switch (videoFilter) {
      case 'cinematic': ctx.filter = 'contrast(1.1) saturate(1.2) brightness(0.95)'; break;
      case 'noir': ctx.filter = 'grayscale(1) contrast(1.2) brightness(0.9)'; break;
      case 'warm': ctx.filter = 'sepia(0.2) contrast(1.05) saturate(1.1)'; break;
      default: ctx.filter = 'none';
    }
  };

  const drawStandardFrame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    if (!canvas || !ctx || !video) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();

    if (enableAI && bgMode === 'blur') {
      ctx.filter = 'blur(15px)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (enableAI && bgMode === 'image' && virtualBgImage) {
      const scale = Math.max(canvas.width / virtualBgImage.width, canvas.height / virtualBgImage.height);
      const x = (canvas.width / 2) - (virtualBgImage.width / 2) * scale;
      const y = (canvas.height / 2) - (virtualBgImage.height / 2) * scale;
      ctx.drawImage(virtualBgImage, x, y, virtualBgImage.width * scale, virtualBgImage.height * scale);
    }

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    applyFilters(ctx);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    drawLogo(ctx, canvas.width, canvas.height);
  };

  const drawLogo = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (logoImageRef.current) {
      const size = logoSize;
      let x = 20, y = 20;
      if (logoPosition.includes('right')) x = w - size - 40;
      if (logoPosition.includes('center')) x = (w - size) / 2;
      if (logoPosition.includes('bottom')) y = h - size - 40;
      if (logoPosition === 'center') y = (h - size) / 2;
      ctx.drawImage(logoImageRef.current, x, y, size, size);
    }
  };

  const initiateRecordingSequence = () => {
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;

    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const startActualRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;

    let mixedTracks: MediaStreamTrack[] = [];
    if (audioContextRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        mixedTracks = stream.getAudioTracks();
        if (audioFile && bgAudioElementRef.current) {
          bgAudioElementRef.current.currentTime = 0;
          bgAudioElementRef.current.play();
        }
    }

    const canvasStream = canvas.captureStream(30);
    mixedTracks.forEach(t => canvasStream.addTrack(t));

    const recorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 3000000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => finalizeRecording(new Blob(chunks, { type: 'video/webm' }));

    mediaRecorderRef.current = recorder;
    recorder.start(1000);

    setIsRecording(true);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setTimeLeftDisplay(remaining);
      if (remaining === 0) handleStopRecording();
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    if (bgAudioElementRef.current) bgAudioElementRef.current.pause();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const finalizeRecording = async (blob: Blob) => {
    if (outputFormat === 'mp4') {
       await convertToMp4(blob);
    } else {
       downloadVideo(blob, 'webm');
    }
  };

  const convertToMp4 = async (webmBlob: Blob) => {
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
        await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
        await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'copy', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');
        downloadVideo(new Blob([data], { type: 'video/mp4' }), 'mp4');
        await ffmpeg.deleteFile('input.webm');
        await ffmpeg.deleteFile('output.mp4');
    } catch (e) {
        console.error("FFmpeg Error:", e);
        alert("MP4 conversion is not supported on this device/browser security setting. Downloading WebM instead (it works everywhere!).");
        downloadVideo(webmBlob, 'webm');
    } finally {
        setIsConverting(false);
    }
  };

  const downloadVideo = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-video-${Date.now()}.${ext}`;
    a.click();
  };

  const sections = (pitchScript && pitchScript.problem) ? (
    pitchScript.script_type === 'demo' ? [
      { title: 'PROBLEM', text: pitchScript.problem },
      { title: 'REQUIREMENTS', text: pitchScript.requirements || '' },
      { title: 'SOLUTION', text: pitchScript.solution },
      { title: 'TOOLS', text: pitchScript.tools || '' },
      { title: 'REAL-WORLD USE', text: pitchScript.realworld_use || '' },
      { title: 'TRACTION', text: pitchScript.traction },
    ] : [
      { title: 'PROBLEM', text: pitchScript.problem },
      { title: 'SOLUTION', text: pitchScript.solution },
      { title: 'TRACTION', text: pitchScript.traction },
    ]
  ) : [
    { title: 'SETUP', text: 'Generate a script to see it here.' },
    { title: 'INSTRUCTIONS', text: 'Look at the camera lens, not the screen. Speak naturally. This text will scroll automatically when you start.' }
  ];

  return (
    <CyberCard
      icon={<Film size={32} strokeWidth={1.5} />}
      title="Video Creator Studio"
      description="Professional recording suite with Auto-Scroll Teleprompter & AI."
      badge={isPro ? 'STUDIO UNLOCKED' : 'PRO LOCKED'}
    >
      <audio ref={bgAudioElementRef} src={audioFile} loop crossOrigin="anonymous" />

      {!isPro ? (
        <div className="text-center py-8">
           <p className="text-gray-400 mb-4">Upgrade to access AI Tools, Green Screen, and Teleprompter.</p>
           <button onClick={onUpgradeClick} className="bg-accent-yellow text-black px-6 py-2 font-bold hover:bg-white">UPGRADE TO PRO</button>
        </div>
      ) : (
      <>
      {!isRecording && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

          <div className="space-y-4">
            <div className="border border-gray-800 p-4 rounded bg-black/40">
              <label className="text-xs font-mono text-accent-yellow flex items-center gap-2 mb-3">
                <Sparkles size={14}/> LOGO GENERATION
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleGenerateLogo}
                  disabled={isGeneratingLogo || !pitchScript}
                  className="flex-1 bg-gradient-to-r from-purple-900 to-blue-900 border border-blue-700 text-white text-xs font-bold py-2 px-3 rounded hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingLogo ? <Sparkles className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                  {isGeneratingLogo ? "GENERATING..." : "GENERATE WITH AI"}
                </button>
                <label className="cursor-pointer bg-gray-800 text-gray-300 text-xs py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2">
                  <ImageIcon size={14}/> UPLOAD
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const r = new FileReader();
                    r.onload = ev => {
                      const src = ev.target?.result as string;
                      setLogoFile(src);
                      const img = new Image();
                      img.src = src;
                      img.crossOrigin = "anonymous";
                      img.onload = () => { logoImageRef.current = img; };
                    };
                    if(e.target.files?.[0]) r.readAsDataURL(e.target.files[0]);
                  }}/>
                </label>
              </div>
            </div>

            <div className="border border-gray-800 p-4 rounded bg-black/40">
              <label className="text-xs font-mono text-accent-yellow flex items-center gap-2 mb-3">
                 <Music size={14} /> BACKING TRACK
              </label>
              <input type="file" accept="audio/*" onChange={e => {
                 const r = new FileReader();
                 r.onload = ev => setAudioFile(ev.target?.result as string);
                 if(e.target.files?.[0]) r.readAsDataURL(e.target.files[0]);
              }} className="text-xs text-gray-400 w-full file:bg-gray-800 file:border-0 file:text-white file:text-xs file:px-2 file:py-1 file:rounded file:mr-2 cursor-pointer"/>
            </div>
          </div>

          <div className="space-y-4">
             <div className={`border p-4 rounded transition-colors ${enableAI ? 'border-accent-yellow bg-accent-yellow/5' : 'border-gray-800 bg-black/40'}`}>
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                      <Cpu size={14} className={enableAI ? "text-accent-yellow" : "text-gray-500"}/>
                      <span className="text-xs font-mono font-bold text-gray-300">AI GREEN SCREEN</span>
                   </div>
                   <button onClick={() => setEnableAI(!enableAI)} className={`relative w-8 h-4 rounded-full transition-colors ${enableAI ? 'bg-accent-yellow' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 left-0.5 bg-black w-3 h-3 rounded-full transition-transform ${enableAI ? 'translate-x-4' : ''}`}/>
                   </button>
                </div>
                {enableAI && (
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={()=>setBgMode('blur')} className={`p-2 text-xs border rounded ${bgMode==='blur'?'border-accent-yellow text-accent-yellow':'border-gray-700 text-gray-400'}`}>Blur</button>
                     <label className={`p-2 text-xs border rounded text-center cursor-pointer ${bgMode==='image'?'border-accent-yellow text-accent-yellow':'border-gray-700 text-gray-400'}`}>
                       Image <input type="file" accept="image/*" className="hidden" onChange={e => {
                         const f = e.target.files?.[0];
                         if(f) {
                           const i = new Image();
                           i.src=URL.createObjectURL(f);
                           i.onload=()=>setVirtualBgImage(i);
                           setBgMode('image');
                         }
                       }}/>
                     </label>
                  </div>
                )}
             </div>

             <div className="border border-gray-800 p-4 rounded bg-black/40">
                <label className="text-xs font-mono text-accent-yellow flex items-center gap-2 mb-3">
                   <Palette size={14} /> CINEMATIC FILTERS
                </label>
                <div className="grid grid-cols-4 gap-2">
                   {['none', 'cinematic', 'noir', 'warm'].map((f) => (
                      <button key={f} onClick={() => setVideoFilter(f as any)} className={`text-[10px] uppercase py-2 border rounded ${videoFilter === f ? 'border-accent-yellow text-white bg-accent-yellow/20' : 'border-gray-700 text-gray-400'}`}>
                        {f}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <div
        className="relative bg-black border border-gray-800 aspect-video rounded-xl overflow-hidden group shadow-2xl"
        onMouseEnter={() => setShowPrompterControls(true)}
        onMouseLeave={() => setShowPrompterControls(false)}
      >

         <canvas ref={canvasRef} className="w-full h-full object-cover absolute inset-0 z-0"/>
         <video
            ref={previewVideoRef}
            className={`w-full h-full object-cover absolute inset-0 transform -scale-x-100 z-0 ${enableAI || isRecording ? 'hidden' : 'block'}`}
            playsInline muted autoPlay
         />
         <video ref={videoRef} className="hidden" playsInline muted autoPlay />

         {showPreview && (
           <div className="absolute bottom-4 left-4 z-30 bg-black/60 p-2 rounded backdrop-blur-md border border-white/10">
             <div className="flex items-center gap-2 mb-1">
               <Mic size={10} className={isRecording ? "text-red-500 animate-pulse" : "text-gray-400"} />
               <span className="text-[9px] font-mono text-gray-300">MIC INPUT</span>
             </div>
             <canvas ref={audioVisualizerCanvasRef} width={80} height={24} className="rounded opacity-80" />
           </div>
         )}

         {showPreview && (
           <div className="absolute top-[30%] left-0 w-full z-20 pointer-events-none opacity-50 flex items-center group-hover:opacity-100 transition-opacity">
              <div className="w-full border-t border-dashed border-red-500/50"></div>
              <div className="absolute right-2 text-[10px] text-red-500 bg-black/50 px-1 rounded font-mono">EYE LEVEL</div>
           </div>
         )}

         {countdown !== null && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
             <div className="text-9xl font-black text-accent-yellow animate-bounce">
               {countdown}
             </div>
           </div>
         )}

         {showPreview && (
           <div className="absolute inset-0 z-30 flex flex-col pointer-events-none">
             <div className="h-32 bg-gradient-to-b from-black via-black/80 to-transparent z-40" />

             <div
                ref={teleprompterRef}
                className="flex-1 overflow-y-auto text-center px-12 no-scrollbar"
                style={{
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  scrollBehavior: 'auto'
                }}
             >
                <div style={{ paddingTop: '30vh', paddingBottom: '50vh' }}>
                   {sections.map((section, idx) => (
                      <div key={idx} className="mb-24">
                         <h3 className="text-accent-yellow font-mono text-sm mb-4 tracking-widest uppercase opacity-70 border-b border-accent-yellow/20 inline-block pb-1">
                           {section.title}
                         </h3>
                         <div
                           className="font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-relaxed"
                           style={{ fontSize: `${fontSize}px` }}
                         >
                            {section.text}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-40" />
           </div>
         )}

         {showPreview && (
           <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showPrompterControls || isPaused ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full p-2 px-6 flex items-center gap-6 shadow-xl pointer-events-auto">

                 {isRecording && (
                   <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="hover:text-accent-yellow text-white transition-colors"
                    title={isPaused ? "Resume Scroll" : "Pause Scroll"}
                   >
                     {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
                   </button>
                 )}

                 <div className="flex items-center gap-2">
                    <MoveVertical size={16} className="text-gray-400"/>
                    <div className="flex flex-col">
                       <span className="text-[9px] text-gray-500 font-mono uppercase">Speed</span>
                       <input
                        type="range" min="1" max="8" step="0.5"
                        value={scrollSpeed}
                        onChange={e => setScrollSpeed(Number(e.target.value))}
                        className="w-20 h-1 accent-accent-yellow bg-gray-700 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                    <Type size={16} className="text-gray-400"/>
                    <div className="flex flex-col">
                       <span className="text-[9px] text-gray-500 font-mono uppercase">Size</span>
                       <input
                        type="range" min="18" max="64"
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="w-20 h-1 accent-accent-yellow bg-gray-700 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>
                 </div>

                 <button
                   onClick={() => setIsMirrored(!isMirrored)}
                   className={`p-2 rounded-full transition-colors ${isMirrored ? 'bg-accent-yellow text-black' : 'text-gray-400 hover:text-white'}`}
                   title="Mirror Text (for Teleprompter Glass)"
                 >
                    <FlipHorizontal size={18}/>
                 </button>
              </div>
           </div>
         )}

         {!isRecording && !showPreview && (
           <div className="absolute inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-800 rounded-full"><Video size={32} className="text-accent-yellow"/></div>
              <button onClick={startPreview} className="bg-accent-yellow text-black px-8 py-3 rounded font-bold hover:bg-white transition-colors">
                 ACTIVATE STUDIO
              </button>
              <p className="text-gray-500 text-xs max-w-xs text-center">We recommend Chrome/Edge for best performance.</p>
           </div>
         )}
      </div>

      {!isRecording && showPreview && !isConverting && (
        <div className="mt-4 flex gap-4">
           <button onClick={initiateRecordingSequence} className="flex-1 bg-accent-yellow hover:bg-white text-black text-lg font-bold py-4 rounded tracking-wide transition-all shadow-lg flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"/> START RECORDING (AUTO-SCROLL)
           </button>

           <div className="flex items-center gap-2 bg-black border border-gray-800 px-4 rounded">
              <span className="text-xs text-gray-500">FORMAT:</span>
              <button onClick={()=>setOutputFormat('webm')} className={`text-xs font-bold px-2 py-1 rounded ${outputFormat==='webm'?'bg-gray-700 text-white':'text-gray-500'}`}>WEBM</button>
              <button onClick={()=>setOutputFormat('mp4')} className={`text-xs font-bold px-2 py-1 rounded ${outputFormat==='mp4'?'bg-gray-700 text-white':'text-gray-500'}`}>MP4</button>
           </div>
        </div>
      )}

      {isRecording && (
        <div className="mt-4 flex justify-between items-center bg-gray-900 p-4 rounded border border-red-900/50">
           <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
              <span className="text-red-500 font-mono font-bold">RECORDING IN PROGRESS</span>
              <span className="text-white font-mono">{Math.floor(timeLeftDisplay / 60)}:{(timeLeftDisplay % 60).toString().padStart(2, '0')}</span>
           </div>
           <button onClick={handleStopRecording} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold text-sm">
             STOP & SAVE
           </button>
        </div>
      )}

      {isConverting && (
         <div className="mt-4 bg-gray-900 border border-accent-yellow p-4 rounded flex items-center gap-4 animate-pulse">
            <Download className="text-accent-yellow"/>
            <div className="flex-1">
               <div className="text-white font-bold text-sm mb-1">Converting to MP4...</div>
               <div className="h-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-accent-yellow transition-all duration-300" style={{width: `${conversionProgress}%`}}/></div>
            </div>
            <span className="text-accent-yellow font-mono text-sm">{conversionProgress}%</span>
         </div>
      )}
      </>
      )}
    </CyberCard>
  );
};
