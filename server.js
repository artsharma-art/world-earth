import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/config", (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";

  res.set("Cache-Control", "no-store");

  res.json({
    googleMapsApiKey: apiKey
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "WORLD EARTH",
    time: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.sendFile("index.html", {
    root: "public"
  });
});

app.listen(PORT, () => {
  console.log(`WORLD EARTH running on port ${PORT}`);
});
