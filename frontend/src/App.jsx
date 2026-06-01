import { useState, useEffect } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faLink, faUser, faArrowLeft, faBolt, faRotateRight, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  // count mirrors user.urlCount in DB; for logged-out guests it tracks session usage
  const [count, setCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [myUrls, setMyUrls] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlsLoading, setUrlsLoading] = useState(false);

  const BASE_URL = "https://url-shortener-full.onrender.com";
  const isDisabled = !user && count >= 1;

  const handleClick = async () => {
    if (loading) return;
    try {
      setError("");
      setShortUrl("");

      if (count >= 1 && !user) {
        setError("Please login to continue");
        return;
      }

      if (!url.trim()) return;

      setLoading(true);
      const response = await fetch(`${BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url.trim(),
          customCode: customCode.trim(),
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

      const isDuplicate = myUrls.some(u => `${BASE_URL}/${u.shortCode}` === data);
      if (!isDuplicate) {
        setCount(prev => prev + 1);
      }

      if (showProfile && user) {
        fetchMyUrls();
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || shortUrl);
    if (!text) {
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      setUser(loggedInUser);
      setError("");

      try {
        const res = await fetch(`${BASE_URL}/user/${loggedInUser.email}`);
        if (res.ok) {
          const userData = await res.json();
          setCount(userData.urlCount);
          setIsPremium(userData.isPremium);
        } else {
          setCount(0);
          setIsPremium(false);
        }
      } catch {
        setCount(0);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error(err);
        alert("Login failed!");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
    }
    setUser(null);
    setCount(0);
    setIsPremium(false);
    setMyUrls([]);
    setShortUrl("");
    setError("");
    setShowProfile(false);
  };

  const handlePayment = async () => {
    const res = await fetch(`${BASE_URL}/create-order`, { method: "POST" });
    const data = await res.json();
    const options = {
      key: "rzp_test_SbPYtXoyOaGtJj",
      amount: data.amount,
      currency: data.currency,
      name: "URL Shortener",
      description: "Upgrade Plan",
      order_id: data.id,
      handler: async function (response) {
        alert("Payment Successful");
        await fetch(`${BASE_URL}/upgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email })
        });
        setIsPremium(true);
        setCount(0);
      },
      modal: { ondismiss: function () { alert("Payment failed or cancelled"); } },
      prefill: { name: user?.displayName, email: user?.email },
      theme: { color: "#00f5ff" }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const fetchMyUrls = async () => {
    if (!user) return;
    try {
      setUrlsLoading(true);
      const res = await fetch(`${BASE_URL}/my-urls/${user.email}`);
      const data = await res.json();
      setMyUrls(data);
      setCount(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setUrlsLoading(false);
    }
  };

  useEffect(() => {
    if (showProfile && user) {
      fetchMyUrls();
    }
  }, [showProfile]);

  const handleDelete = async (code) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this URL?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${BASE_URL}/delete/${code}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete. Please try again.");
        return;
      }
      setCount(prev => Math.max(0, prev - 1));
      setMyUrls(prev => prev.filter(u => u.shortCode !== code));
    } catch (err) {
      console.log(err);
      alert("Failed to delete. Please try again.");
    }
  };

  const isLimitError = error.toLowerCase().includes("limit") || error.toLowerCase().includes("upgrade");

  return (
    <div>
      {/* ── Glass Header ── */}
      <header className="glass-header">
        <span className="brand-logo">
          <FontAwesomeIcon icon={faLink} style={{ marginRight: "8px", fontSize: "14px" }} />
          LinkSnap
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!user ? (
            <button className="btn-login" onClick={handleLogin}>
              Login with Google
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user.photoURL && (
                <img src={user.photoURL} alt="avatar" className="user-avatar" />
              )}
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                {user.displayName}
              </span>
              {!showProfile && (
                <button onClick={() => setShowProfile(true)} style={{ padding: "7px 14px", fontSize: "13px" }}>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: "6px" }} />
                  Profile
                </button>
              )}
              <button onClick={handleLogout} style={{ padding: "7px 12px", fontSize: "13px" }} title="Logout">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="app-wrapper" style={{ marginTop: "60px" }}>

        {count >= 1 && !user && (
          <p className="msg-warn" style={{ marginBottom: "16px" }}>
            ⚠ You've used your free link. Login to generate more.
          </p>
        )}

        {!showProfile && (
          <div className="glass-panel">
            <h1 style={{ fontSize: "36px", marginBottom: "6px" }}>
              URL Shortener
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "28px" }}>
              Shorten any link instantly — fast, clean, trackable.
            </p>

            {!showCustom ? (
              <>
                <input
                  type="text"
                  placeholder="Paste your long URL here…"
                  value={url}
                  disabled={isDisabled}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isDisabled && url && handleClick()}
                  className="glass-input"
                  style={{ marginBottom: "18px" }}
                />

                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={handleClick}
                    disabled={!url || isDisabled || loading}
                    className="btn-primary-glow"
                  >
                    <FontAwesomeIcon icon={faBolt} style={{ marginRight: "7px" }} />
                    {loading ? "Shortening…" : "Random Code"}
                  </button>

                  <button
                    onClick={() => setShowCustom(true)}
                    disabled={!url || isDisabled || loading}
                  >
                    Custom Code
                  </button>
                </div>
              </>
            ) : (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "14px" }}>
                  Enter your custom short code
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="my-brand-link"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && customCode && handleClick()}
                    className="glass-input"
                  />
                  <FontAwesomeIcon
                    icon={faCheck}
                    onClick={handleClick}
                    className="icon"
                    style={{ fontSize: "18px", color: loading ? "rgba(0,245,255,0.4)" : "#00f5ff", cursor: loading ? "not-allowed" : "pointer" }}
                  />
                </div>
                <button
                  onClick={() => { setShowCustom(false); setCustomCode(""); }}
                  style={{ marginTop: "14px", padding: "7px 16px", fontSize: "13px" }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: "6px" }} />
                  Back
                </button>
              </div>
            )}

            {shortUrl && (
              <>
                <hr className="glass-divider" style={{ marginTop: "24px" }} />
                <div className="result-box">
                  <b style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Short URL</b>
                  <a href={shortUrl} target="_blank" rel="noreferrer" className="short-link" style={{ fontSize: "14px" }}>
                    {shortUrl}
                  </a>
                  <FontAwesomeIcon icon={faCopy} onClick={() => handleCopy()} className="icon" />
                  {copied && <span className="msg-success">✓ Copied!</span>}
                </div>
              </>
            )}

            {error && (
              <div style={{ marginTop: "18px" }}>
                <p className="msg-error">{error}</p>
                {isLimitError && user && (
                  <button onClick={handlePayment} className="btn-upgrade" style={{ marginTop: "10px" }}>
                    ⚡ Upgrade Plan
                  </button>
                )}
                {isLimitError && !user && (
                  <button onClick={handleLogin} className="btn-upgrade" style={{ marginTop: "10px" }}>
                    Login to continue
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showProfile && (
          <div className="glass-panel profile-header" style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ textAlign: "left" }}>
                <h2 style={{ marginBottom: "4px" }}>Your URLs</h2>
                <span className="badge-glow">
                  {myUrls.length} link{myUrls.length !== 1 ? "s" : ""} created
                  {isPremium && " · Premium"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={fetchMyUrls}
                  disabled={urlsLoading}
                  style={{ padding: "7px 12px", fontSize: "13px" }}
                  title="Refresh clicks"
                >
                  <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: "13px" }} spin={urlsLoading} />
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  style={{ padding: "7px 14px", fontSize: "13px" }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: "6px" }} />
                  Back
                </button>
              </div>
            </div>

            <hr className="glass-divider" />

            {urlsLoading ? (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", paddingTop: "16px" }}>
                Loading…
              </p>
            ) : myUrls.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", paddingTop: "16px" }}>
                No URLs yet. Go create your first one!
              </p>
            ) : (
              myUrls.map((item, index) => (
                <div key={item._id || index} className="url-card">
                  <p style={{ marginBottom: "5px" }}>
                    <b>Original: </b>
                    <span style={{ wordBreak: "break-all" }}>{item.originalUrl}</span>
                  </p>
                  <p style={{ marginBottom: "8px" }}>
                    <b>Short: </b>
                    <a
                      href={`${BASE_URL}/${item.shortCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="short-link"
                    >
                      {`${BASE_URL}/${item.shortCode}`}
                    </a>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="clicks-badge">
                      ↗ {item.clicks} click{item.clicks !== 1 ? "s" : ""}
                    </span>
                    <div>
                      <FontAwesomeIcon
                        icon={faCopy}
                        className="icon"
                        title="Copy"
                        onClick={() => navigator.clipboard.writeText(`${BASE_URL}/${item.shortCode}`)}
                      />
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="icon btn-danger-glass"
                        title="Delete"
                        style={{ color: "rgba(248,113,113,0.7)" }}
                        onClick={() => handleDelete(item.shortCode)}
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
