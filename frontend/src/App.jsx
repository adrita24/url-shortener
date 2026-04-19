import {useState} from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import { faTrash} from "@fortawesome/free-solid-svg-icons";
import { faLink, faUser, faArrowLeft, faBolt } from "@fortawesome/free-solid-svg-icons";

function App(){
  const [url, setUrl]=useState("");
  const [shortUrl, setShortUrl]=useState("");
  const [copied, setCopied]=useState(false);
  const [customCode, setCustomCode]=useState("");
  const [showCustom, setShowCustom]=useState(false);
  const [error, setError]=useState("");
  const [user, setUser]=useState(null);
  const [count, setCount]=useState(0);
  const [myUrls, setMyUrls]=useState([]);
  const [showProfile, setShowProfile]=useState(false);

  const BASE_URL="https://url-shortener-full.onrender.com";
  const isDisabled=!user && count>=1;

  const handleClick = async () => {
    try {
      setError("");
      setShortUrl("");

      if(count>=1 && !user){
        setError("Please login to continue");
        return;
      }

      const response = await fetch(`${BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url,
          customCode: customCode,
          email: user?.email,
          name: user?.displayName
        })
      });

      if (!response.ok) {
        const errMsg = await response.text();
        setError(errMsg);
        return;
      }

      const data = await response.text();
      setShortUrl(data);
      setShowCustom(false);
      setCustomCode("");
      setCount(count+1);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  const handleCopy=()=>{
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(()=>{ setCopied(false); }, 2000);
  };

  const handleLogin = async ()=>{
    try{
      const result=await signInWithPopup(auth, provider);
      setUser(result.user);
      setCount(0);
      setError("");
    } catch(err){
      if(err.code!=="auth/popup-closed-by-user"){
        console.error(err);
        alert("Login failed!");
      }
    }
  };

  const handlePayment = async()=>{
    const res = await fetch(`${BASE_URL}/create-order`, { method: "POST" });
    const data = await res.json();
    const options={
      key:"rzp_test_SbPYtXoyOaGtJj",
      amount: data.amount,
      currency: data.currency,
      name: "URL Shortener",
      description: "Upgrade Plan",
      order_id: data.id,
      handler: async function(response){
        alert("Payment Successful");
        await fetch(`${BASE_URL}/upgrade`,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email })
        });
      },
      modal:{ ondismiss: function(){ alert("Payment failed or cancelled"); } },
      prefill:{ name: user?.displayName, email: user?.email },
      theme:{ color:"#00f5ff" }
    };
    const rzp=new window.Razorpay(options);
    rzp.open();
  };

  const fetchMyUrls = async()=>{
    try{
      const res=await fetch(`${BASE_URL}/my-urls/${user.email}`);
      const data=await res.json();
      setMyUrls(data);
    }catch(err){ console.error(err); }
  };

  const handleDelete = async(code)=>{
    const confirmDelete=window.confirm("Are you sure you want to delete this URL?");
    if(!confirmDelete) return;
    try{
      await fetch(`${BASE_URL}/delete/${code}`,{ method:"DELETE" });
      fetchMyUrls();
    }catch(err){ console.log(err); }
  };

  return(
    <div>
      {/* ── Glass Header ── */}
      <header className="glass-header">
        <span className="brand-logo">
          <FontAwesomeIcon icon={faLink} style={{marginRight:"8px", fontSize:"14px"}} />
          LinkSnap
        </span>

        <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
          {!user ? (
            <button className="btn-login" onClick={handleLogin}>
              Login with Google
            </button>
          ) : (
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
              {user.photoURL && (
                <img src={user.photoURL} alt="avatar" className="user-avatar" />
              )}
              <span style={{fontSize:"13px", color:"rgba(255,255,255,0.7)"}}>
                {user.displayName}
              </span>
              {!showProfile && (
                <button onClick={() => { setShowProfile(true); fetchMyUrls(); }} style={{padding:"7px 14px", fontSize:"13px"}}>
                  <FontAwesomeIcon icon={faUser} style={{marginRight:"6px"}} />
                  Profile
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="app-wrapper" style={{marginTop:"60px"}}>

        {/* ── Login nudge ── */}
        {count >= 1 && !user && (
          <p className="msg-warn" style={{marginBottom:"16px"}}>
            ⚠ You've used your free link. Login to generate more.
          </p>
        )}

        {/* ── URL Shortener Panel ── */}
        {!showProfile && (
          <div className="glass-panel">
            <h1 style={{fontSize:"36px", marginBottom:"6px"}}>
              URL Shortener
            </h1>
            <p style={{color:"rgba(255,255,255,0.4)", fontSize:"13px", marginBottom:"28px"}}>
              Shorten any link instantly — fast, clean, trackable.
            </p>

            {!showCustom ? (
              <>
                <input
                  type="text"
                  placeholder="Paste your long URL here…"
                  value={url}
                  disabled={isDisabled}
                  onChange={(e)=>setUrl(e.target.value)}
                  className="glass-input"
                  style={{marginBottom:"18px"}}
                />

                <div style={{display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap"}}>
                  <button
                    onClick={handleClick}
                    disabled={!url || isDisabled}
                    className="btn-primary-glow"
                  >
                    <FontAwesomeIcon icon={faBolt} style={{marginRight:"7px"}} />
                    Random Code
                  </button>

                  <button
                    onClick={()=>setShowCustom(true)}
                    disabled={!url || isDisabled}
                  >
                    Custom Code
                  </button>
                </div>
              </>
            ) : (
              <div style={{animation:"fadeUp 0.3s ease"}}>
                <p style={{color:"rgba(255,255,255,0.5)", fontSize:"13px", marginBottom:"14px"}}>
                  Enter your custom short code
                </p>
                <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
                  <input
                    type="text"
                    placeholder="my-brand-link"
                    value={customCode}
                    onChange={(e)=>setCustomCode(e.target.value)}
                    className="glass-input"
                  />
                  <FontAwesomeIcon
                    icon={faCheck}
                    onClick={handleClick}
                    className="icon"
                    style={{fontSize:"18px", color:"#00f5ff"}}
                  />
                </div>
                <button
                  onClick={()=>{ setShowCustom(false); setCustomCode(""); }}
                  style={{marginTop:"14px", padding:"7px 16px", fontSize:"13px"}}
                >
                  <FontAwesomeIcon icon={faArrowLeft} style={{marginRight:"6px"}} />
                  Back
                </button>
              </div>
            )}

            {/* ── Result ── */}
            {shortUrl && (
              <>
                <hr className="glass-divider" style={{marginTop:"24px"}} />
                <div className="result-box">
                  <b style={{color:"rgba(255,255,255,0.6)", fontSize:"13px"}}>Short URL</b>
                  <a href={shortUrl} target="_blank" className="short-link" style={{fontSize:"14px"}}>
                    {shortUrl}
                  </a>
                  <FontAwesomeIcon icon={faCopy} onClick={handleCopy} className="icon" />
                  {copied && <span className="msg-success">✓ Copied!</span>}
                </div>
              </>
            )}

            {/* ── Error ── */}
            {error && (
              <div style={{marginTop:"18px"}}>
                <p className="msg-error">{error}</p>
                <button onClick={handlePayment} className="btn-upgrade" style={{marginTop:"10px"}}>
                  ⚡ Upgrade Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Profile Panel ── */}
        {showProfile && (
          <div className="glass-panel profile-header" style={{maxWidth:"600px"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px"}}>
              <div style={{textAlign:"left"}}>
                <h2 style={{marginBottom:"4px"}}>Your URLs</h2>
                <span className="badge-glow">{count} links created</span>
              </div>
              <button
                onClick={()=>setShowProfile(false)}
                style={{padding:"7px 14px", fontSize:"13px"}}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{marginRight:"6px"}} />
                Back
              </button>
            </div>

            <hr className="glass-divider" />

            {myUrls.length===0 ? (
              <p style={{color:"rgba(255,255,255,0.35)", fontSize:"14px", paddingTop:"16px"}}>
                No URLs yet. Go create your first one!
              </p>
            ) : (
              myUrls.map((item, index)=>(
                <div key={index} className="url-card">
                  <p style={{marginBottom:"5px"}}>
                    <b>Original: </b>{item.originalUrl}
                  </p>
                  <p style={{marginBottom:"8px"}}>
                    <b>Short: </b>
                    <a
                      href={`${BASE_URL}/${item.shortCode}`}
                      target="_blank"
                      className="short-link"
                    >
                      {`${BASE_URL}/${item.shortCode}`}
                    </a>
                  </p>
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                    <span className="clicks-badge">
                      ↗ {item.clicks} clicks
                    </span>
                    <div>
                      <FontAwesomeIcon
                        icon={faCopy}
                        className="icon"
                        title="Copy"
                        onClick={()=>
                          navigator.clipboard.writeText(`${BASE_URL}/${item.shortCode}`)
                        }
                      />
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="icon btn-danger-glass"
                        title="Delete"
                        style={{color:"rgba(248,113,113,0.7)"}}
                        onClick={()=> handleDelete(item.shortCode)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
