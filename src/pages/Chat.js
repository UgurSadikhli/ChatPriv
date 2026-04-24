import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPeer, encode, decode } from "../utils/webrtc";
import { QRCodeSVG } from "qrcode.react"; // Import QR library
import ChatBox from "../components/ChatBox";
import qrimage from "../qrimage.png";

const COLORS = {
  bg: "#000000",
  card: "#0A0A0A",
  border: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#666666",
  brand: "#1D9E75",
  brandDark: "#146e52",
  danger: "#FF3B30",
  modalBg: "rgba(10, 10, 10, 0.95)"
};

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
  const [showQR, setShowQR] = useState(false); 

  const isLoading = status.includes("...") || status.includes("Generating") || status.includes("Joining");
  const pcRef = useRef(null);
  const channelRef = useRef(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ ...copyFeedback, [type]: true });
    setTimeout(() => setCopyFeedback({ ...copyFeedback, [type]: false }), 2000);
  };

  const endSession = () => {
    if (channelRef.current) channelRef.current.close();
    if (pcRef.current) pcRef.current.close();
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
      const decrypted = secureVault.unprocess(e.data);
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
      const encrypted = secureVault.process(msg);
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
    <div style={{ background: COLORS.bg, color: COLORS.text, padding: "40px 20px", fontFamily: "Inter, system-ui", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loader { border: 2px solid #111; border-top: 2px solid ${COLORS.brand}; border-radius: 50%; width: 14px; height: 14px; animation: spin 0.8s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justifyContent: center; z-index: 1000; backdrop-filter: blur(5px); }
        .modal-content { background: ${COLORS.card}; padding: 30px; border-radius: 20px; border: 1px solid ${COLORS.border}; text-align: center; position: relative; max-width: 90%; }
      `}</style>

      {/* QR MODAL */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)} 
        style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            display: 'flex',           
            alignItems: 'center',      
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.85)', 
            backdropFilter: 'blur(5px)',
            zIndex: 9999 
          }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px", fontSize: "14px", letterSpacing: "1px" }}>SCAN TO JOIN</h3>
            <div style={{ background: "white", padding: "15px", borderRadius: "12px", display: "inline-block" }}>
              <QRCodeSVG value={link} size={200} level="M" />
            </div>
            <button 
              onClick={() => setShowQR(false)}
              style={{ display: "block", margin: "20px auto 0", background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "8px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

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

        {/* DESTROY BUTTON */}
        {(connected || link || joinerAnswer) && (
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button onClick={endSession} style={{ background: 'transparent', border: `1px solid ${COLORS.danger}`, color: COLORS.danger, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
              × DESTROY SESSION
            </button>
          </div>
        )}

        {/* INITIALIZE BUTTON */}
        {!params.get("offer") && !link && (
          <button onClick={startAsCreator} style={mainBtn()}>INITIALIZE SECURE ROOM</button>
        )}

        {/* CREATOR STEPS */}
        {link && !connected && (
          <div style={{ background: COLORS.card, padding: "24px", borderRadius: "16px", border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: "12px", marginBottom: "10px", color: COLORS.textMuted }}>STEP 1: INVITE</p>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button 
                onClick={() => handleCopy(link, 'link')} 
                style={{ ...mainBtn(copyFeedback.link ? "#FFFFFF" : COLORS.brand), color: copyFeedback.link ? "#000" : "#FFF", flex: 2 }}
              >
                {copyFeedback.link ? "✓ COPIED" : "COPY LINK"}
              </button>
            
            </div>
              <button 
                onClick={() => setShowQR(true)}
                style={{ ...mainBtn("transparent"), border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center",justifyContent : "center", textAlign: "center", gap: "8px", fontSize: "11px" }}
              >
                <img src={qrimage} alt="QR Code" style={{ width: "16px", height: "16px"}} /> VIEW QR
              </button>

            <p style={{ fontSize: "12px", marginBottom: "10px", color: COLORS.textMuted }}>STEP 2: PASTE RESPONSE</p>
            <textarea 
              value={answerInput} onChange={e => setAnswerInput(e.target.value)} 
              style={{ width: "95%", background: "#050505", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.brand, padding: "12px", fontSize: "12px", height: "80px", marginBottom: "15px", outline: "none" }} 
              placeholder="Paste response..."
            />
            <button onClick={applyAnswer} style={{ ...mainBtn('transparent'), border: `1px solid ${COLORS.brand}`, color: COLORS.brand }}>CONNECT</button>
          </div>
        )}

        {/* JOINER STEPS */}
        {joinerAnswer && !connected && (
          <div style={{ background: COLORS.card, padding: "24px", borderRadius: "16px", border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>Final Security Token Generated:</p>
            <button onClick={() => handleCopy(joinerAnswer, 'answer')} style={mainBtn(copyFeedback.answer ? "#FFFFFF" : COLORS.brand)}>
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