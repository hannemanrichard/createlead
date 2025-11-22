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

    const { fullName, offer, phone, address, channel, product } = req.body;
    const { data: dataPrice, error: errorPrice } = await supabase
      .from("products")
      .select("retail_price, retail_price_2, retail_price_3")
      .eq("name", product)
      .single();

    if (errorPrice) {
      console.log("Error fetching product info:", errorPrice);
    }

    // Build a joined price string from the product_info fields, skipping null/undefined/empty
    const priceParts = [
      dataPrice && dataPrice.retail_price,
      dataPrice && dataPrice.retail_price_2,
      dataPrice && dataPrice.retail_price_3,
    ]
      .filter((p) => p !== null && p !== undefined && p !== "")
      .map((p) => String(p));
    const { retail_price, retail_price_2, retail_price_3 } = dataPrice || {};
    // If we have any price parts use them joined with ' - ', otherwise fall back to the incoming offer
    // const priceValue = priceParts.length > 0 ? priceParts.join(" - ") : ``;
    const priceValue = `${retail_price ? `1 - ${retail_price} ` : ``}${
      retail_price_2 ? ` 2 - ${retail_price_2 * 2} ` : ``
    }${retail_price_3 ? ` 3 - ${retail_price_3 * 3}` : ``}`;
    const { data, error } = await supabase.from("leads").insert({
      first_name: fullName.split(" ")[0],
      last_name: fullName.split(" ")[1] || "",
      phone,
      offer: offer,
      agent_id: agentId,
      status: "initial",
      address: address || "",
      channel: channel || "tiktok",
      objective: "leadgen",
      price: priceValue,
      product: product || "",
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
