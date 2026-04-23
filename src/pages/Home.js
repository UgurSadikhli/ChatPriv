import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "24px",
      boxSizing: "border-box",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{
        position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480, width: "100%",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}>
        {/* Lock icon */}
       <div style={{
  width: 85, 
  height: 85, 
  borderRadius: '22px', 
  border: "1px solid rgba(29, 158, 117, 0.3)",
  background: "linear-gradient(135deg, rgba(29, 158, 117, 0.1) 0%, rgba(29, 158, 117, 0.02) 100%)",
  backdropFilter: "blur(8px)",
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center",
  margin: "0 auto 32px",
  boxShadow: "0 10px 25px -5px rgba(29, 158, 117, 0.2), 0 8px 10px -6px rgba(29, 158, 117, 0.1)",
  overflow: "hidden"
}}>
  <img 
    src={logo} 
    alt="ChatPriv Logo" 
    style={{ 
      width: '100%', 
      height: '100%', 
      objectFit: 'cover', 
      transition: 'transform 0.5s ease'
    }} 
  />
</div>
        <h1 style={{
          fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 400,
          color: "#fff", margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.1,
        }}>
          ChatPriv
        </h1>

        <p style={{
          fontSize: 16, color: "rgba(255,255,255,0.45)", margin: "0 0 48px",
          lineHeight: 1.6, fontFamily: "sans-serif", fontWeight: 300,
        }}>
          Serverless. No accounts. No logs.<br />
          End-to-end encrypted via WebRTC.
          <br/>
          Developed by <a href="https://github.com/ugursadikhli" target="_blank" rel="noopener noreferrer" style={{ color: "#1D9E75", textDecoration: "none", fontWeight: 500 }}>Uğur Sadixli</a>.
        </p>

        <button
          onClick={() => navigate("/chat?create=true")}
          style={{
            width: "100%", padding: "16px 24px",
            background: "#1D9E75", color: "#fff",
            border: "none", borderRadius: 12,
            fontSize: 16, fontWeight: 600, fontFamily: "sans-serif",
            cursor: "pointer", letterSpacing: "0.2px",
            transition: "background 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => e.target.style.background = "#17856A"}
          onMouseLeave={e => e.target.style.background = "#1D9E75"}
          onMouseDown={e => e.target.style.transform = "scale(0.98)"}
          onMouseUp={e => e.target.style.transform = "scale(1)"}
        >
          Create New Room
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 20,
          marginTop: 40, justifyContent: "center",
        }}>
          {["No server", "No storage", "No tracking","Direct messaging"].map((txt, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif",
              
            }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1D9E75" }} />
              {txt}
              
            </div>
            
          ))}
        </div>
        
      </div>
    </div>
  );
}