import { useEffect, useRef, useState } from "react";
import mic from "../mic.png";
import send from "../send.png";

const COLORS = {
  brand: "#1D9E75",
  bg: "#000000",
  card: "#111111",
  border: "#333333",
  danger: "#FF3B30"
};

const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

// --- PREVIOUS SLEEK AUDIO DESIGN ---
function CustomAudio({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', padding: '4px 0' }}>
      <button onClick={togglePlay} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isPlaying ? "┃┃" : "▶"}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '2px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.7, color: '#fff' }}>
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <audio 
        ref={audioRef} src={src} hidden 
        onTimeUpdate={() => setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)} 
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

export default function ChatBox({ messages, onSend, disabled }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => onSend(`AUDIO_CLIP:${reader.result}`);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
    } catch (err) { alert("Mic access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecTime(0);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '450px', background: COLORS.bg, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      
      {/* Messages Area (Previous Layout) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => {
          const isAudio = msg.text.startsWith("AUDIO_CLIP:");
          const isMe = msg.side === "me";
          return (
            <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? COLORS.brand : "#1a1a1a", padding: '12px 16px', borderRadius: '18px', fontSize: '14px', maxWidth: '85%', border: `1px solid ${isMe ? COLORS.brand : COLORS.border}` }}>
              {isAudio ? (
                <div style={{ color: 'white' }}>
                  <div style={{ fontSize: '9px', marginBottom: '4px', opacity: 0.6, letterSpacing: '1px' }}>VOICE NOTE</div>
                  <CustomAudio src={msg.text.split("AUDIO_CLIP:")[1]} />
                </div>
              ) : <span style={{ color: 'white' }}>{msg.text}</span>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area (Previous Layout Restored) */}
      <div style={{ padding: '12px', background: COLORS.card, display: 'flex', gap: '10px', alignItems: 'center', borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={() => isRecording ? stopRecording() : startRecording()}
          style={{ 
            background: isRecording ? COLORS.danger : "transparent", 
            border: `1px solid ${isRecording ? COLORS.danger : COLORS.brand}`, 
            borderRadius: '25px', width: '44px', height: '44px', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          {isRecording ? <span style={{color: 'white', fontSize: '18px'}}>■</span> : <img width="24" height="24" src={mic} alt="🎤"/>}
        </button>

        <input
          disabled={disabled || isRecording}
          value={isRecording ? `Recording... (${formatTime(recTime)})` : text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !isRecording && (onSend(text.trim()), setText(""))}
          placeholder="Message..."
          style={{ flex: 1, background: '#000', border: `1px solid ${COLORS.border}`, borderRadius: '22px', color: isRecording ? COLORS.danger : '#fff', padding: '12px 18px', outline: 'none' }}
        />
        
        <button 
          onClick={() => { if(text.trim()) { onSend(text.trim()); setText(""); } }} 
          disabled={isRecording || !text.trim()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.brand, border: 'none', borderRadius: '25px', width: '44px', height: '44px', cursor: 'pointer', color: 'white', opacity: isRecording ? 0.5 : 1 }}
        ><img width="24" height="24" src={send} alt="🎤"/></button>
      </div>
    </div>
  );
}