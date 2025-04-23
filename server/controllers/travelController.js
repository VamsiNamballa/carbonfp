import axios from "axios";
import TravelLog from "../models/TravelLog.js";
import User from "../models/User.js";

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

const FAU_COORDS = {
  lat: 26.3705,
  lon: -80.1028,
};

const getCoordinates = async (location) => {
  const res = await axios.get("https://api.openrouteservice.org/geocode/search", {
    params: { api_key: ORS_API_KEY, text: location },
  });
  const coords = res.data.features[0].geometry.coordinates;
  return { lon: coords[0], lat: coords[1] };
};

const getDistanceKm = async (fromCoords, toCoords) => {
  const res = await axios.post(
    ORS_BASE_URL,
    {
      coordinates: [
        [fromCoords.lon, fromCoords.lat],
        [toCoords.lon, toCoords.lat],
      ],
    },
    {
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.routes[0].summary.distance / 1000; // in km
};

export const calculateDistanceAndCredits = async (req, res) => {
  const { from, travelStyle } = req.body;

  // ✅ Validate required fields
  if (!from || !travelStyle) {
    return res.status(400).json({ error: "Missing 'from' or 'travelStyle' field" });
  }

  // ✅ Validate travel style
  const validStyles = ["Work From Home", "Public Transport", "Bicycle"];
  if (!validStyles.includes(travelStyle)) {
    return res.status(400).json({ error: "Invalid travel style" });
  }

  try {
    const start = from;
    const end = "Florida Atlantic University";

    const fromCoords = await getCoordinates(start);
    const toCoords = await getCoordinates(end);
    const distanceKm = await getDistanceKm(fromCoords, toCoords);

    let credits = 0;
    if (travelStyle === "Work From Home") credits = distanceKm * 1.5;
    if (travelStyle === "Public Transport") credits = distanceKm * 2;
    if (travelStyle === "Bicycle") credits = distanceKm * 3;

    res.json({
      distanceKm: distanceKm.toFixed(2),
      carbonCreditsEarned: Math.round(credits),
    });
  } catch (err) {
    console.error("Distance calculation failed:", err);
    res.status(500).json({ error: "Failed to calculate distance" });
  }
};

export const logTravelEntry = async (req, res) => {
  const { distanceKm, carbonCreditsEarned, travelStyle, from } = req.body;

  // ✅ Validate required fields
  if (!distanceKm || !carbonCreditsEarned || !travelStyle || !from) {
    return res.status(400).json({ error: "Missing required travel data" });
  }

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const log = await TravelLog.create({
      employeeId: userId,
      companyId: user.companyId,
      distanceKm,
      carbonCreditsEarned,
      travelStyle,
      from,
      to: "Florida Atlantic University", // always fixed
    });

    res.status(201).json(log);
  } catch (err) {
    console.error("Log travel failed:", err);
    res.status(500).json({ error: "Failed to log travel" });
  }
};

export const getUserTravelLogs = async (req, res) => {
  try {
    const logs = await TravelLog.find({ employeeId: req.params.id }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Fetch logs failed:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
