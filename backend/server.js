const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 3000;

const Mongo_URL = process.env.MONGO_URL;

mongoose.connect(Mongo_URL)
    .then(() => {
        console.log("Database connected");
    })
    .catch((err) => {
        console.log("error found", err);
    });

const urlSchema = new mongoose.Schema({
    shortCode: String,
    originalUrl: String,
    clicks: {
        type: Number,
        default: 0
    },
    email: String
});

const Url = mongoose.model("Url", urlSchema);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});

app.use(cors());
app.use(express.json());

function isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.post("/shorten", async (req, res) => {
    const { originalUrl, customCode, email, name } = req.body;

    if (!originalUrl) {
        return res.status(400).send("URL required");
    }

    if (!isValidUrl(originalUrl)) {
        return res.status(400).send("Invalid URL. Must start with http:// or https://");
    }

    let user = null;

    if (email) {
        user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, name });
            await user.save();
        }
    }

    if (email && !customCode) {
        const existingUrl = await Url.findOne({ originalUrl, email });
        if (existingUrl) {
            return res.send(`https://url-shortener-full.onrender.com/${existingUrl.shortCode}`);
        }
    }

    if (user) {
        const actualCount = await Url.countDocuments({ email });
        if (!user.isPremium && actualCount >= 5) {
            return res.status(403).send("Free limit reached. Please upgrade.");
        }
        user.urlCount = actualCount + 1; 
        await user.save();
    }

    let shortCode;

    if (customCode && customCode.trim() !== "") {
        if (!/^[a-zA-Z0-9-_]+$/.test(customCode.trim())) {
            return res.status(400).send("Custom code can only contain letters, numbers, hyphens, and underscores");
        }
        const existingCustom = await Url.findOne({ shortCode: customCode.trim() });
        if (existingCustom) {
            return res.status(400).send("Custom code already taken");
        }
        shortCode = customCode.trim();
    } else {
        let attempts = 0;
        do {
            shortCode = Math.random().toString(36).substring(2, 8);
            attempts++;
            if (attempts > 10) break; // safety valve
        } while (await Url.findOne({ shortCode }));
    }

    const newUrl = new Url({
        shortCode,
        originalUrl,
        email
    });

    await newUrl.save();

    res.send(`https://url-shortener-full.onrender.com/${shortCode}`);
});

app.get("/my-urls/:email", async (req, res) => {
    const { email } = req.params;
    try {
        const urls = await Url.find({ email });
        res.json(urls);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching urls");
    }
});

app.get("/user/:email", async (req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        const actualCount = await Url.countDocuments({ email });
        if (user.urlCount !== actualCount) {
            user.urlCount = actualCount;
            await user.save();
        }
        res.json({ urlCount: actualCount, isPremium: user.isPremium });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching user");
    }
});

app.get("/:code", async (req, res) => {
    const { code } = req.params;

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
        return res.status(404).send("URL not found");
    }

    url.clicks++;
    await url.save();

    res.redirect(url.originalUrl);
});

app.post("/create-order", async (req, res) => {
    try {
        const options = {
            amount: 14900,
            currency: "INR",
            receipt: "order_rcptid_11"
        };

        const order = await razorpay.orders.create(options);
        
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating order");
    }
});

app.post("/upgrade", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        user.isPremium = true;
        await user.save();
        res.send("User upgraded successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Upgrade failed");
    }
});

app.delete("/delete/:code", async (req, res) => {
    const { code } = req.params;
    try {
        const url = await Url.findOne({ shortCode: code });
        if (!url) {
            return res.status(404).send("URL not found");
        }
        await Url.findOneAndDelete({ shortCode: code });
        if (url.email) {
            const user = await User.findOne({ email: url.email });
            if (user) {
                user.urlCount = await Url.countDocuments({ email: url.email });
                await user.save();
            }
        }
        res.send("Deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Delete failed");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
