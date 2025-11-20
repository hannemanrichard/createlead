const axios = require("axios");
const express = require("express");
const cors = require("cors");
const https = require("https");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Warning: SUPABASE_URL and/or SUPABASE_KEY are not set. Create a .env file or set environment variables."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);
app.post("/api/create-lead", async (req, res) => {
  try {
    const agents_dict = [17, 38, 34];
    const agentId = agents_dict[Math.floor(Math.random() * agents_dict.length)];

    const { fullName, offer, phone, address, channel } = req.body;
    const { data, error } = await supabase.from("leads").insert({
      first_name: fullName.split(" ")[0],
      last_name: fullName.split(" ")[1] || "",
      phone,
      offer: `${offer}`,
      agent_id: agentId,
      status: "initial",
      address: address || "",
      channel: channel || "tiktok",
      objective: "leadgen",
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ message: "Lead created successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
