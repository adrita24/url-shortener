const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const User=require("./models/User");
const Razorpay=require("razorpay");

const app=express();
const PORT=process.env.PORT||3000;

const Mongo_URL=process.env.MONGO_URL;

mongoose.connect(Mongo_URL)
    .then(()=>{
        console.log("Database connected");
    })
    .catch((err)=>{
        console.log("error found", err);
    });

const urlSchema=new mongoose.Schema({
    shortCode: String,
    originalUrl: String,
    clicks: {
        type:Number,
        default:0
    },
    email: String
});

const Url=mongoose.model("Url", urlSchema);

const razorpay=new Razorpay({
    key_id:"rzp_test_SbPYtXoyOaGtJj",
    key_secret:"49cr40dpIiXH3DBOmbc3ePvt"
}); 

app.get("/",(req,res)=>{
    res.send("Server is running");
});

app.use(cors());
app.use(express.json());

app.post("/shorten",async(req,res)=>{
    const {originalUrl, customCode, email, name}=req.body;

    let user=null;

    if(email){
        user= await User.findOne({email});
        if(!user){
            user= new User({
                email, 
                name
            });
            await user.save();
        }
    }

    if(user){
        if(!user.isPremium && user.urlCount>=5){
            return res.status(403).send("Free limit reached. Please upgrade.");
        }
        user.urlCount+=1;
        await user.save();
    }

    if(!originalUrl){
        return res.status(400).send("URL required");
    }

    const existingUrl = await Url.findOne({ originalUrl });
    if(existingUrl && !customCode){
        return res.send(`http://localhost:3000/${existingUrl.shortCode}`)
    }

    let shortCode;

    if(customCode && customCode.trim() !==""){
        const existingCustom=await Url.findOne({shortCode:customCode});       
        if(existingCustom){
            return res.status(400).send("Custom code already taken");
        }
        shortCode=customCode;
    } else{
        shortCode=Math.random().toString(36).substring(2,8);
    }

    const newUrl=new Url({
        shortCode,
        originalUrl,
        email
    });

    await newUrl.save();

    res.send(`http://localhost:3000/${shortCode}`);
});

app.get("/:code",async(req,res)=>{
    const {code}=req.params;

    const url=await Url.findOne({shortCode:code});

    if(!url){
        return res.status(404).send("URL not found");
    }

    url.clicks++;
    await url.save();
    
    res.redirect(url.originalUrl);
});

app.get("/my-urls/:email", async(req, res)=>{
    const {email}=req.params;
    try{
        const urls=await Url.find({email});
        res.json(urls);
    } catch(err){
        console.log(err);
        res.status(500).send("Error fetching urls");
    }
});

app.post("/create-order", async(req,res)=>{
    try{
        const options={
            amount: 14900,
            currency: "INR",
            receipt: "order_rcptid_11"
        };

        const order=await razorpay.orders.create(options);

        res.json(order);
    } catch(err){
        console.log(err);
        res.status(500).send("Error creating order");
    }
});

app.post("/upgrade", async(req, res)=>{
    const {email}=req.body;
    try{
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).send("User not found");
        }
        user.isPremium=true;
        user.urlCount=0;

        await user.save();

        res.send("User upgraded successfully");
    } catch (err){
        console.log(err);
        res.status(500).send("Upgrade failed");
    }
});

app.delete("/delete/:code",async(req,res)=>{
    const {code}=req.params;
    try{
        const url=await Url.findOne({shortCode: code});
        if(!url){
            return res.status(404).send("URL not found");
        }
        await Url.findOneAndDelete({shortCode:code});
        if(url.email){
            const user=await User.findOne({email:url.email});
            if(user && user.urlCount>0){
                user.urlCount-=1;
                await user.save();
            }
        }
        res.send("Deleted successfully");
    }catch(err){
        console.log(err);
        res.status(500).send("Delete failed");
    }
});

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});