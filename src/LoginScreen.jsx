import { useState } from 'react';
import { loginWithPermissions } from '../auth';

export default function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Email and password required."); return; }
    setLoading(true);
    setError("");
    const result = await loginWithPermissions(email, password);
    if (!result.success) { setError(result.error || "Login failed."); setLoading(false); return; }
    if (!result.role)    { setError("No permissions found. Contact your administrator."); setLoading(false); return; }
    onLogin(result);
    setLoading(false);
  };

  const inp = {width:"100%",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"13px 14px",color:"#dde8f4",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:12};

  return(
    <div style={{minHeight:"100vh",background:"#040d18",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:"100%",maxWidth:360,background:"rgba(255,255,255,0.025)",border:"1.5px solid rgba(56,189,248,0.15)",borderRadius:24,padding:"40px 28px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:"rgba(56,189,248,0.1)",border:"1.5px solid rgba(56,189,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24}}>🔐</div>
          <div style={{fontSize:20,fontWeight:800,color:"#dde8f4",letterSpacing:"0.04em",marginBottom:6}}>Staff Login</div>
          <div style={{fontSize:12,color:"#3d5268"}}>Upstream Initiative · Authorized Personnel Only</div>
        </div>
        <input style={inp} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} autoCapitalize="none" autoCorrect="off" disabled={loading}/>
        <input style={inp} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&handleLogin()} disabled={loading}/>
        {error&&<div style={{fontSize:12,color:"#f87171",textAlign:"center",marginBottom:12,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)"}}>{error}</div>}
        <div onClick={loading?null:handleLogin} style={{padding:"14px",borderRadius:12,background:loading?"rgba(56,189,248,0.08)":"linear-gradient(135deg,#0ea5e9,#2563eb)",textAlign:"center",fontSize:14,fontWeight:700,color:loading?"#3d5268":"#fff",cursor:loading?"default":"pointer",marginBottom:16}}>{loading?"Signing in...":"Sign In"}</div>
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#2d4a66",lineHeight:1.65}}>
          <div style={{fontSize:10,fontWeight:700,color:"#3d5268",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Staff Access Only</div>
          PST members, supervisors, and admins log in here. Regular users do not need an account — just scan your agency QR code to get started.
        </div>
      </div>
    </div>
  );
}
