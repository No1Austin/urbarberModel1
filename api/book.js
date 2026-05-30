// api/book.js
import { google } from "googleapis";

export default async function handler(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || "*";

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Booking-Key");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", allowed);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const {
      fullName,
      gender,
      email,
      phone,
      service = "Standard cut",
      start,
      end,
      inHome,
      location,
      notes,
      price,
    } = body || {};

    if (!fullName || !email || !phone || !start || !end) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (process.env.BOOKING_SECRET) {
      const key = req.headers["x-booking-key"];
      if (!key || key !== process.env.BOOKING_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const jwt = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth: jwt });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const timeZone = String(start).endsWith("Z") ? "UTC" : "America/Toronto";

    const bookingKey = `${email.toLowerCase()}-${start}-${end}-${service}`;

    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      privateExtendedProperty: [`bookingKey=${bookingKey}`],
    });

    if (existingEvents.data.items?.length > 0) {
      const existing = existingEvents.data.items[0];

      return res.status(409).json({
        ok: false,
        error: "This booking already exists.",
        eventId: existing.id,
        htmlLink: existing.htmlLink,
      });
    }

    const event = {
      summary: `Urbarber - ${fullName}`,
      description:
        `Service: ${service}${inHome ? " (Home Service)" : " (In-Shop)"}\n` +
        `Gender: ${gender || "-"}\n` +
        `Price: $${price ?? (25 + (inHome ? 10 : 0))}\n` +
        `Phone: ${phone}\nEmail: ${email}\nNotes: ${notes || "-"}`,
      location: inHome ? location || "Client address" : "Urbarber Barbershop",
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      attendees: [{ email, displayName: fullName }],
      reminders: { useDefault: true },
      extendedProperties: {
        private: {
          bookingKey,
        },
      },
    };

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "all",
    });

    return res.status(200).json({
      ok: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to create calendar event",
    });
  }
}