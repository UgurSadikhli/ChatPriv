import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPeer, encode, decode } from "../utils/webrtc";
import ChatBox from "../components/ChatBox";

const COLORS = {
  bg: "#000000",
  card: "#0A0A0A",
  border: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#666666",
  brand: "#1D9E75",
  brandDark: "#146e52",
  danger: "#FF3B30"
};

// --- SECURITY UTILS: MESSAGE OBFUSCATION ---
const secureVault = {
  process: (str, key = 42) => {
    return btoa(str.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ key)).join(''));
  },
  unprocess: (encodedStr, key = 42) => {
    try {
      const decoded = atob(encodedStr);
      return decoded.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ key)).join('');
    } catch (e) { return "Error: Decryption Failed"; }
  }
};

export default function Chat() {
  const [params, setParams] = useSearchParams();
  const [link, setLink] = useState("");
  const [messages, setMessages] = useState([]);
  const [answerInput, setAnswerInput] = useState("");
  const [joinerAnswer, setJoinerAnswer] = useState("");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("System Idle");
  const [copyFeedback, setCopyFeedback] = useState({ link: false, answer: false });

  const isLoading = status.includes("...") || status.includes("Generating") || status.includes("Joining");
  const pcRef = useRef(null);
  const channelRef = useRef(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ ...copyFeedback, [type]: true });
    setTimeout(() => setCopyFeedback({ ...copyFeedback, [type]: false }), 2000);
  };

  // --- END SESSION LOGIC ---
  const endSession = () => {
    if (channelRef.current) channelRef.current.close();
    if (pcRef.current) pcRef.current.close();
    
    // Clear State
    pcRef.current = null;
    channelRef.current = null;
    setMessages([]);
    setConnected(false);
    setLink("");
    setJoinerAnswer("");
    setStatus("Session Terminated");
    setParams({}); 
  };

  const waitForIce = (peer) =>
    new Promise((resolve) => {
      if (peer.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (peer.iceGatheringState === "complete") {
          peer.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      peer.addEventListener("icegatheringstatechange", check);
    });

  const setupChannel = useCallback((ch) => {
    channelRef.current = ch;
    ch.onopen = () => { setConnected(true); setStatus("Encryption Active"); };
    ch.onmessage = (e) => {
      // DECODING INCOMING MESSAGE
      const decrypted = secureVault.unprocess(e.data);
      // console.log("Received Encrypted:", e.data);
      // console.log("Decrypted Message:", decrypted);
      setMessages((prev) => [...prev, { side: "them", text: decrypted }]);
    };
    ch.onclose = () => { setConnected(false); setStatus("Session Ended"); };
  }, []);

  const startAsCreator = async () => {
    setStatus("Generating Key...");
    const peer = createPeer();
    pcRef.current = peer;
    const ch = peer.createDataChannel("chat");
    setupChannel(ch);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIce(peer);
    setLink(`${window.location.origin}/chat?offer=${encode(peer.localDescription)}`);
    setStatus("Invite Ready");
  };

  useEffect(() => {
    const offer = params.get("offer");
    if (offer && !pcRef.current) {
      setStatus("Joining Session...");
      const peer = createPeer();
      pcRef.current = peer;
      peer.ondatachannel = (e) => setupChannel(e.channel);
      peer.setRemoteDescription(decode(offer)).then(async () => {
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await waitForIce(peer);
        setJoinerAnswer(encode(peer.localDescription));
        setStatus("Response Generated");
      });
    }
  }, [params, setupChannel]);

  const applyAnswer = async () => {
    try {
      await pcRef.current.setRemoteDescription(decode(answerInput.trim()));
      setStatus("Finalizing...");
    } catch (err) { alert("Invalid Response Code"); }
  };

  const sendMessage = (msg) => {
    if (channelRef.current?.readyState === "open") {
      // ENCODING OUTGOING MESSAGE
      const encrypted = secureVault.process(msg);
      // console.log(" Sending Encrypted:", encrypted);
      // console.log(" Original Message:", msg);
      channelRef.current.send(encrypted);
      setMessages((prev) => [...prev, { side: "me", text: msg }]);
    }
  };

  const mainBtn = (color = COLORS.brand) => ({
    width: "100%", padding: "14px", borderRadius: "8px", border: "none",
    background: color, color: "white", fontWeight: "bold", cursor: "pointer",
    transition: "transform 0.1s, opacity 0.2s"
  });

  return (
    <div style={{  background: COLORS.bg, color: COLORS.text, padding: "40px 20px", fontFamily: "Inter, system-ui" }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loader { border: 2px solid #111; border-top: 2px solid ${COLORS.brand}; border-radius: 50%; width: 14px; height: 14px; animation: spin 0.8s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "auto" }}>
        
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ letterSpacing: "2px", fontWeight: "900", margin: 0 }}>
            Chat<span style={{ color: COLORS.brand }}>Priv</span>
          </h2>
          
          <div style={{ 
            display: "inline-flex", alignItems: "center", marginTop: "15px", padding: "6px 16px", borderRadius: "20px", 
            background: "#080808", border: `1px solid ${connected ? COLORS.brand : "#222"}`, 
            fontSize: "11px", color: connected ? COLORS.brand : (isLoading ? COLORS.brand : COLORS.textMuted),
            fontWeight: "600", letterSpacing: "0.5px"
          }}>
            {isLoading && <span className="loader"></span>}
            {status.toUpperCase()}
          </div>
        </div>

        {/* END SESSION BUTTON (Visible only when connected or setup started) */}
        {(connected || link || joinerAnswer) && (
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button 
              onClick={endSession}
              style={{ background: 'transparent', border: `1px solid ${COLORS.danger}`, color: COLORS.danger, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
            >
              × DESTROY SESSION
            </button>
          </div>
        )}

        {/* SETUP LOGIC */}
        {!params.get("offer") && !link && (
          <button onClick={startAsCreator} style={mainBtn()} onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
            INITIALIZE SECURE ROOM
          </button>
        )}

        {/* CREATOR STEPS */}
        {link && !connected && (
          <div style={{ background: COLORS.card, padding: "24px", borderRadius: "16px", border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: "12px", marginBottom: "10px", color: COLORS.textMuted }}>STEP 1: INVITE</p>
            <button 
              onClick={() => handleCopy(link, 'link')} 
              style={{ ...mainBtn(copyFeedback.link ? "#FFFFFF" : COLORS.brand), color: copyFeedback.link ? "#000" : "#FFF", marginBottom: "20px" }}
            >
              {copyFeedback.link ? "✓ COPIED" : "COPY LINK"}
            </button>
            <p style={{ fontSize: "12px", marginBottom: "10px", color: COLORS.textMuted }}>STEP 2: PASTE RESPONSE</p>
            <textarea 
              value={answerInput} onChange={e => setAnswerInput(e.target.value)} 
              style={{ width: "95%",maxWidth: "95%", maxHeight: "100px", background: "#050505", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.brand, padding: "12px", fontSize: "12px", height: "80px", marginBottom: "15px", outline: "none" }} 
              placeholder="Paste response..."
            />
            <button onClick={applyAnswer} style={{ ...mainBtn('transparent'), border: `1px solid ${COLORS.brand}`, color: COLORS.brand }}>CONNECT</button>
          </div>
        )}

        {/* JOINER STEPS */}
        {joinerAnswer && !connected && (
          <div style={{ background: COLORS.card, padding: "24px", borderRadius: "16px", border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>Final Security Token Generated:</p>
            <button 
              onClick={() => handleCopy(joinerAnswer, 'answer')} 
              style={{ ...mainBtn(copyFeedback.answer ? "#FFFFFF" : COLORS.brand), color: copyFeedback.answer ? "#000" : "#FFF" }}
            >
              {copyFeedback.answer ? "✓ COPIED TOKEN" : "COPY TOKEN"}
            </button>
          </div>
        )}

        {/* CHAT AREA */}
        <div style={{ marginTop: "10px", background: COLORS.card, borderRadius: "16px", border: `1px solid ${COLORS.border}`, overflow: "hidden", opacity: connected ? 1 : 0.5, pointerEvents: connected ? "all" : "none", transition: "opacity 0.5s" }}>
          <ChatBox messages={messages} onSend={sendMessage} disabled={!connected} />
        </div>
      </div>
    </div>
  );
}