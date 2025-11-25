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

    // Sanitize inputs by removing control characters (newlines, tabs, etc.)
    const sanitize = (str) => {
      if (typeof str !== "string") return str;
      return str.replace(/[\n\r\t\x00-\x1F\x7F]/g, " ").trim();
    };

    const { fullName, offer, phone, address, channel, product } = req.body;

    console.log("input values:", {
      first_name: fullName,
      last_name: "",
      phone: phone,
      offer: offer,
      agent_id: agentId,
      status: "initial",
      address: address || "",
      channel: channel || "tiktok",
      objective:
        sanitizedChannel === "tiktok" ? "tiktok-leadgen" : "meta-leadgen",
      price: priceValue,
      product: sanitizedProduct || "",
    });

    const sanitizedFullName = sanitize(fullName);
    const sanitizedOffer = sanitize(offer);
    const sanitizedPhone = sanitize(phone);
    const sanitizedAddress = sanitize(address);
    const sanitizedChannel = sanitize(channel);
    const sanitizedProduct = sanitize(product);

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

    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name: sanitizedFullName,
        last_name: "",
        phone: sanitizedPhone,
        offer: sanitizedOffer,
        agent_id: agentId,
        status: "initial",
        address: sanitizedAddress || "",
        channel: sanitizedChannel || "tiktok",
        objective:
          sanitizedChannel === "tiktok" ? "tiktok-leadgen" : "meta-leadgen",
        price: priceValue,
        product: sanitizedProduct || "",
      })
      .select()
      .single();

    if (data) {
      const { error: errorHop } = await supabase
        .from("lead_hop")
        .insert({ lead_id: data.id, agent_id: agentId });
      if (errorHop) {
        console.log("something went wrong with hop: ", errorHop);
      }
    }
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
