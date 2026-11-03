const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function getVideoId(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0];
    }

    if (["youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const match = url.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
      return match ? match[2] : null;
    }
  } catch {}

  return null;
}

app.get("/api/youtube/metadata", async (req, res) => {
  const id = getVideoId(req.query.url || "");

  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({
      ok: false,
      error: "সঠিক YouTube লিংক দিন।"
    });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    const apiUrl =
      "https://www.youtube.com/oembed?format=json&url=" +
      encodeURIComponent(videoUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return res.status(404).json({
        ok: false,
        error: "ভিডিওর তথ্য পাওয়া যায়নি।"
      });
    }

    const data = await response.json();

    res.json({
      ok: true,
      title: data.title,
      thumbnail: data.thumbnail_url,
      author: data.author_name,
      videoId: id
    });
  } catch {
    res.status(500).json({
      ok: false,
      error: "সার্ভার সমস্যা হয়েছে।"
    });
  }
});

app.listen(process.env.PORT || 3000);
