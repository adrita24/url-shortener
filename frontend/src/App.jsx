import {useState} from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import { faTrash} from "@fortawesome/free-solid-svg-icons";

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
      headers: {
        "Content-Type": "application/json"
      },
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
      console.log("Backend error:",errMsg);
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

    setTimeout(()=>{
      setCopied(false);
    }, 2000);
  };

  const handleLogin =async ()=>{
    try{
      const result=await signInWithPopup(auth, provider);
      console.log("Login Success:",result.user);
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

  const handlePayment= async()=>{
    const res= await fetch(`${BASE_URL}/create-order`,{
      method: "POST"
    });

    const data= await res.json();

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
          headers:{
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: user.email
          })
        });
      },

      modal:{
        ondismiss: function(){
          alert("Payment failed or cancelled");
        }
      },

      prefill:{
        name: user?.displayName,
        email: user?.email
      },

      theme:{
        color:"#3399cc"
      }
    };
    const rzp=new window.Razorpay(options);
    rzp.open();
  };

  const fetchMyUrls=async()=>{
    try{
      const res=await fetch(`${BASE_URL}/my-urls/${user.email}`);
      const data=await res.json();

      console.log("my urls:", data);

      setMyUrls(data);
    }catch(err){
      console.error(err);
    }
  };

  const handleDelete=async(code)=>{
    const confirmDelete=window.confirm("Are you sure you want to delete this URL?");
    if(!confirmDelete) return;
    try{
      await fetch(`${BASE_URL}/delete/${code}`,{
        method:"DELETE"
      });
      fetchMyUrls();
    }catch(err){
      console.log(err);
    }
  };

  return(
    <div style={{textAlign:"center", marginTop:"30vh"}}>

      {!user && (
        <button onClick={handleLogin} style={{ marginBottom: "20px" }}>
          Login with Google
        </button>
      )} 

      {user && !showProfile && (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={() => {
            setShowProfile(true);
            fetchMyUrls();
          }}>
            Profile
          </button>    
        </div>
      )}

      {count >= 1 && !user && (
        <p style={{ color: "orange", fontSize:"70%"}}>
          Please login to continue
        </p>
      )}

      {!showProfile &&(
        <div>
          <h1>URL Shortener</h1>
          
          <input 
            type="text" 
            placeholder="Enter URL" 
            value={url} 
            disabled={isDisabled}
            onChange={(e)=>setUrl(e.target.value)}
            style={{
              padding:"10px",
              width:"300px",
              textAlign:"center",
              margin:"10px"
            }}>
          </input>
          <br></br>
          
          <button 
            onClick={handleClick} 
            disabled={!url||showCustom || isDisabled}>
              Generate Random Code
          </button>

          <button onClick={()=>setShowCustom(true)} disabled={!url || isDisabled}>
            Create Custom Code
          </button>
        </div>
      )}
      
      {showCustom && !showProfile &&(
        <div>
          <button
            onClick={()=>{
              setShowCustom(false);
              setCustomCode("");
            }}>
              Back
          </button>

          <input
            type="text"
            placeholder="Enter Custom Code"
            value={customCode}
            onChange={(e)=>setCustomCode(e.target.value)}
            style={{padding:"5px", margin:"10px", textAlign:"center"}}
          ></input>

          <FontAwesomeIcon
            icon={faCheck}
            onClick={handleClick}
            className="icon"
          />
        </div>
      )}

      {shortUrl && !showProfile &&(
        <hr style={{width:"400px", opacity:"50%"}}></hr>
      )}
      {shortUrl && !showProfile &&(
        <div style={{display:"flex", alignItems:"center",justifyContent:"center", gap:"10px"}}>
          <b>Short URL:{" "}</b>
            <a href={shortUrl} 
              target="_blank" 
              className="short-link">{shortUrl}</a>
            <FontAwesomeIcon
              icon={faCopy}
              onClick={handleCopy}
              className="icon"
            />
            {copied && <p style={{color:"lightgreen", fontSize:"70%"}}>Copied!</p>}
        </div>
      )}

      {error && !showProfile &&(
        <div>
          <p style={{color:"red", fontSize:"70%"}}>{error}</p>
          {/* {error.includes("upgrade")&&( */}
            <div>
              <button onClick={handlePayment}>
                Upgrade Plan
              </button>
              {/* <button onClick={async()=>{
                await fetch("http://localhost:3000/upgrade",{
                  method:"POST",
                  headers:{
                    "Content-Type":"application/json"
                  },
                  body: JSON.stringify({email:user.email})
                });
                alert("Upgraded manually");
              }}>
                Upgraded manually
              </button> */}
            </div>
          {/* )} */}
        </div>
      )}

      {showProfile &&(
        <div>
          <h2>Your URLs</h2>
          <p style={{marginBottom:"10px"}}>Total URLs Created: {count}</p>
          <hr style={{width:"400px", opacity:"50%"}}></hr>
          {myUrls.length===0?(
            <p>No URLs yet</p>
          ):(
            myUrls.map((item, index)=>(
              <div key={index}>
                <p><b>Original: </b>{item.originalUrl}</p>
                <p>
                  <b>Short: </b>
                  <a
                    href={`${BASE_URL}/${item.shortCode}`}
                    target="_blank"
                  >
                    {`${BASE_URL}/${item.shortCode}`}
                  </a>
                </p>
                <p>
                  <b>Clicks: </b>{item.clicks}
                </p>
                <p style={{marginTop:"10px"}}>
                  <FontAwesomeIcon
                    icon={faCopy}
                    className="icon"
                    onClick={()=>
                      navigator.clipboard.writeText(
                        `${BASE_URL}/${item.shortCode}`
                      )
                    }></FontAwesomeIcon>

                  <FontAwesomeIcon
                    icon={faTrash}
                    className="icon"
                    onClick={()=>
                      handleDelete(item.shortCode)
                    }></FontAwesomeIcon>
                </p>
                <hr style={{width:"400px", opacity:"50%"}}></hr>
              </div>
            ))
          )}
          <button onClick={()=>setShowProfile(false)}>
            Back
          </button>
        </div>
      )}
      
    </div>
  );
}

export default App;