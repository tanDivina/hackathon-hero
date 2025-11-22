import React, { useState, useEffect, useRef } from 'react';
import { Film, Upload, Music, Image, Download, Video, Settings, Sparkles } from 'lucide-react';
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
  const [logoSize, setLogoSize] = useState<number>(100);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const [isRecording, setIsRecording] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('mp4');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const sections = pitchScript ? (
    pitchScript.script_type === 'demo' ? [
      { title: 'PROBLEM', text: pitchScript.problem, duration: 45 },
      { title: 'REQUIREMENTS', text: pitchScript.requirements || '', duration: 30 },
      { title: 'SOLUTION', text: pitchScript.solution, duration: 60 },
      { title: 'TOOLS', text: pitchScript.tools || '', duration: 30 },
      { title: 'REAL-WORLD USE', text: pitchScript.realworld_use || '', duration: 30 },
      { title: 'TRACTION', text: pitchScript.traction, duration: 15 },
    ] : [
      { title: 'PROBLEM', text: pitchScript.problem, duration: 60 },
      { title: 'SOLUTION', text: pitchScript.solution, duration: 90 },
      { title: 'TRACTION', text: pitchScript.traction, duration: 30 },
    ]
  ) : [];

  useEffect(() => {
    if (projectId) {
      loadSavedAssets();
    } else {
      resetAssets();
    }
  }, [projectId]);

  const loadSavedAssets = async () => {
    if (!projectId) return;

    const assets = await databaseService.getVideoAssets(projectId);
    if (assets) {
      setLogoFile(assets.logo_url);
      setAudioFile(assets.audio_url);
      setLogoPosition(assets.logo_position);
      setLogoSize(assets.logo_size);
      setAudioVolume(assets.audio_volume);
    } else {
      resetAssets();
    }
  };

  const resetAssets = () => {
    setLogoFile('');
    setAudioFile('');
    setLogoPosition('top-right');
    setLogoSize(100);
    setAudioVolume(0.5);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setLogoFile(dataUrl);
        await saveAssets(dataUrl, audioFile, logoPosition, logoSize, audioVolume);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setAudioFile(dataUrl);
        await saveAssets(logoFile, dataUrl, logoPosition, logoSize, audioVolume);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAssets = async (
    logo: string,
    audio: string,
    position: string,
    size: number,
    volume: number
  ) => {
    if (!projectId) return;

    await databaseService.saveVideoAssets(projectId, {
      logo_url: logo,
      audio_url: audio,
      logo_position: position,
      logo_size: size,
      audio_volume: volume,
    });
  };

  const handlePositionChange = async (position: string) => {
    setLogoPosition(position);
    await saveAssets(logoFile, audioFile, position, logoSize, audioVolume);
  };

  const handleSizeChange = async (size: number) => {
    setLogoSize(size);
    await saveAssets(logoFile, audioFile, logoPosition, size, audioVolume);
  };

  const handleVolumeChange = async (volume: number) => {
    setAudioVolume(volume);
    await saveAssets(logoFile, audioFile, logoPosition, logoSize, volume);
  };

  const handleStartRecording = async () => {
    if (!pitchScript) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1920,
          height: 1080,
          facingMode: 'user',
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1920;
      canvas.height = 1080;

      const canvasStream = canvas.captureStream(30);

      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => canvasStream.addTrack(track));

      if (audioFile && audioRef.current) {
        audioRef.current.volume = audioVolume;
        audioRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        recordedBlobRef.current = blob;
        console.log('Recording complete. Blob size:', blob.size, 'bytes');

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setShowTeleprompter(false);
        setCurrentSection(0);
        setTimeRemaining(0);
        setRecordingProgress(0);

        if (outputFormat === 'mp4') {
          if (blob.size === 0) {
            alert('Recording failed: No video data captured');
            return;
          }
          await convertToMp4(blob);
        } else {
          downloadVideo(blob, 'webm');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setShowTeleprompter(true);
      setCurrentSection(0);
      setTimeRemaining(180);

      const startTime = Date.now();
      const totalDuration = 180000;

      const animate = () => {
        if (!videoRef.current || !canvas || !ctx) return;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 180 - Math.floor(elapsed / 1000));
        setTimeRemaining(remaining);
        setRecordingProgress((elapsed / totalDuration) * 100);

        let cumulativeTime = 0;
        let activeSection = 0;
        for (let i = 0; i < sections.length; i++) {
          cumulativeTime += sections[i].duration * 1000;
          if (elapsed < cumulativeTime) {
            activeSection = i;
            break;
          }
          activeSection = sections.length - 1;
        }
        setCurrentSection(activeSection);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        if (logoFile) {
          const img = new Image();
          img.onload = () => {
            const size = logoSize;
            let x = 0;
            let y = 0;

            switch (logoPosition) {
              case 'top-left':
                x = 50;
                y = 50;
                break;
              case 'top-right':
                x = canvas.width - size - 50;
                y = 50;
                break;
              case 'bottom-left':
                x = 50;
                y = canvas.height - size - 50;
                break;
              case 'bottom-right':
                x = canvas.width - size - 50;
                y = canvas.height - size - 50;
                break;
              case 'center':
                x = (canvas.width - size) / 2;
                y = (canvas.height - size) / 2;
                break;
            }

            ctx.drawImage(img, x, y, size, size);
          };
          img.src = logoFile;
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(animate);
        } else {
          mediaRecorder.stop();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }
      };

      animate();
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegRef.current.loaded) {
      console.log('FFmpeg already loaded');
      return ffmpegRef.current;
    }

    console.log('Loading FFmpeg...');
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg log:', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      console.log('FFmpeg progress:', percent);
      if (percent > 20) {
        setConversionProgress(20 + Math.round(percent * 0.6));
      }
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      console.log('Fetching FFmpeg core files...');
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load video converter. Please try again.');
    }

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const convertToMp4 = async (webmBlob: Blob) => {
    try {
      setIsConverting(true);
      setConversionProgress(5);

      const ffmpeg = await loadFFmpeg();
      setConversionProgress(10);

      console.log('Writing input file...');
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
      setConversionProgress(20);

      console.log('Starting conversion...');
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      setConversionProgress(80);
      console.log('Reading output file...');
      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([data], { type: 'video/mp4' });

      setConversionProgress(90);
      downloadVideo(mp4Blob, 'mp4');

      setConversionProgress(95);
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp4');

      setIsConverting(false);
      setConversionProgress(0);
    } catch (error) {
      console.error('Error converting to MP4:', error);
      alert(`Failed to convert video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConverting(false);
      setConversionProgress(0);

      if (recordedBlobRef.current) {
        downloadVideo(recordedBlobRef.current, 'webm');
      }
    }
  };

  const downloadVideo = (blob: Blob, format: 'webm' | 'mp4') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-video.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CyberCard
      icon={<Film size={32} strokeWidth={1.5} />}
      title="Video Creator"
      description="Record a 3-minute pitch video with teleprompter, custom logo overlay, and background music."
      badge={isPro ? (logoFile || audioFile ? 'CONFIGURED' : 'PRO') : undefined}
    >
      {!isPro ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-yellow/20 to-accent-cyan/20 border border-accent-yellow/30 px-4 py-2 mb-4">
            <Sparkles size={20} className="text-accent-yellow" />
            <span className="text-sm font-mono text-gray-300">PRO FEATURE</span>
          </div>
          <p className="text-gray-400 mb-4">
            Record professional 3-minute pitch videos with teleprompter, custom branding, and background music.
          </p>
          <button
            onClick={onUpgradeClick}
            className="bg-accent-yellow text-black px-6 py-2 font-mono font-bold hover:bg-yellow-300 transition-colors"
          >
            UPGRADE TO PRO
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!pitchScript && (
            <div className="bg-black/50 border border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 font-mono">
                Generate a pitch script first to create a video
              </p>
            </div>
          )}

        {!isRecording && !showTeleprompter && (
          <>
            <div className="space-y-3">
              <div className="border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Image size={14} />
                    Logo Upload
                  </label>
                  {logoFile && (
                    <span className="text-xs text-accent-yellow font-mono">UPLOADED</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-800 file:text-gray-300 file:bg-black hover:file:bg-black/50 file:transition-colors"
                />
              </div>

              <div className="border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Music size={14} />
                    Background Music
                  </label>
                  {audioFile && (
                    <span className="text-xs text-accent-yellow font-mono">UPLOADED</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-800 file:text-gray-300 file:bg-black hover:file:bg-black/50 file:transition-colors"
                />
              </div>

              <div className="border border-gray-800 p-4">
                <label className="text-xs text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Download size={14} />
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as 'webm' | 'mp4')}
                  className="w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-gray-700 focus:outline-none"
                >
                  <option value="mp4">MP4 (H.264, widely compatible)</option>
                  <option value="webm">WebM (faster, no conversion)</option>
                </select>
              </div>
            </div>

            {logoFile && (
              <div className="border border-gray-800 p-4 space-y-3">
                <label className="text-xs text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Settings size={14} />
                  Logo Settings
                </label>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Position</p>
                  <select
                    value={logoPosition}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-gray-700 focus:outline-none"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Size: {logoSize}px</p>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={logoSize}
                    onChange={(e) => handleSizeChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {audioFile && (
              <div className="border border-gray-800 p-4">
                <p className="text-xs text-gray-600 mb-2">Volume: {Math.round(audioVolume * 100)}%</p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <button
              onClick={handleStartRecording}
              disabled={!pitchScript}
              className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Video size={16} />
              START RECORDING (3 MIN)
            </button>

            <div className="bg-black/50 border border-gray-800 p-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-500">Instructions:</strong> Click Start Recording to begin.
                Your camera will activate and a teleprompter will show your script sections with timing.
                {outputFormat === 'mp4' && ' Video will be converted to MP4 after recording.'}
                {outputFormat === 'webm' && ' Video saves as WebM format.'}
              </p>
            </div>
          </>
        )}

        {isConverting && (
          <div className="border border-accent-yellow bg-black/90 p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Download size={24} className="text-accent-yellow animate-pulse" />
              <h3 className="text-lg font-bold text-white">Converting to MP4...</h3>
            </div>
            <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-accent-yellow h-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 font-mono">{conversionProgress}% complete</p>
            <p className="text-xs text-gray-600">
              Please wait while we convert your video. This may take a minute.
            </p>
          </div>
        )}

        {showTeleprompter && (
          <div className="space-y-4">
            <div className="bg-accent-yellow text-black p-4 text-center">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold">
                  TIME REMAINING: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
                <span className="font-mono text-sm font-bold">
                  {Math.round(recordingProgress)}%
                </span>
              </div>
              <div className="w-full bg-black h-2">
                <div
                  className="bg-accent-green h-full transition-all duration-300"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-black border-2 border-accent-yellow p-6 space-y-6">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`transition-all ${
                    currentSection === index
                      ? 'opacity-100 scale-100'
                      : 'opacity-40 scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-2xl font-bold ${
                      currentSection === index ? 'text-accent-yellow' : 'text-gray-600'
                    }`}>
                      {section.title}
                    </h3>
                    <span className={`text-sm font-mono ${
                      currentSection === index ? 'text-accent-yellow' : 'text-gray-600'
                    }`}>
                      {section.duration}s
                    </span>
                  </div>
                  <p className={`text-lg leading-relaxed ${
                    currentSection === index ? 'text-white' : 'text-gray-700'
                  }`}>
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleStopRecording}
              className="w-full bg-red-600 text-white font-bold py-3 text-sm tracking-wide hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              STOP & SAVE VIDEO
            </button>
          </div>
        )}

          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} className="hidden" autoPlay muted playsInline />
          {audioFile && (
            <audio ref={audioRef} src={audioFile} className="hidden" loop />
          )}
        </div>
      )}
    </CyberCard>
  );
};
