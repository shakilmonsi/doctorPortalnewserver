const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

//middleware;
app.use(cors());
app.use(express.json());

//  const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
//const bookingsCollection = client.db('doctorsPortal').collection('bookings');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fm710lc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const appointmentOptionCollection = client
      .db("doctorsPortal")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorsPortal")
      .collection("bookings");
    // Use Aggregate to query multiple collection and then merge data

    app.get("/appointmentOption", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();

      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
        console.log(option.name, remainingSlots.length);
      });
      res.send(options);
    });
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `you already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);

      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("DOctors portal server is running ");
});
app.listen(port, () => console.log(`doctors portal server is running${port}`));
