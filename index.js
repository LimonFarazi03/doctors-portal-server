const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
// Jwt
const jwt = require("jsonwebtoken");
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.w0lxv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// dui line ke
// // const cursor = serviceCollection.find(query);
// // const result = await cursor.toArray(cursor);
// ek line a pawar jonow
// //  const services = await serviceCollection.find().toArray();

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("doctors-portal").collection("services");
    const bookingCollection = client.db("doctors-portal").collection("bookings");
    const userCollection = client.db("doctors-portal").collection("users");

    function verifyJWT(req, res, next){
      const authorization = req.headers.authorization;
      if(!authorization){
        return res.send({message: 'unAuthorized access'});
      };
    };

    app.get("/service", async (req, res) => {
      const query = req.body;
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
    app.get('/allusers',async(req,res)=>{
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const options = { upsert: true };
      const filter = { patientEmail: email };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { patientEmail: patientEmail },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "3h" }
      );
      res.send({ result, token });
    });

    // DISCLIMER
    // This is not the proper way
    app.get("/available", async (req, res) => {
      const date = req.query.date;
      // Step1: Get all api
      const services = await serviceCollection.find().toArray();
      // Step2: get the booking that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();
      // // Step3: for each service
      services.forEach((service) => {
        // Step4: find bookings for that service
        const serviceBookings = bookings.filter(
          (book) => book.treatmentName === service.name
        );
        // Step5: select slots for the services bookings
        const bookedSlots = serviceBookings.map((book) => book.slot);
        // Step5: select those slot that are not in bookedSlotes
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.available = available;
      });
      // Step:3 for each service, find bookings for that service
      // services.forEach(service =>{
      //   const serviceBooking = bookings.filter(booking => booking.treatmentName === service.name);
      //   const booked = serviceBooking.map(s=> s.slot);
      //   const available = service.slots.filter(s=>!booked.includes(s));
      //   service.available = available;
      // });

      res.send(services);
    });

    app.get("/booking", async (req, res) => {
      const patientEmail = req.query.patientEmail;
      const authorization = req.headers.authorization;
      // console.log("auth header", authorization);
      const query = { patientEmail: patientEmail };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/booking", verifyJWT, async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const query = {
        treatmentName: booking.treatmentName,
        date: booking.date,
        patientName: booking.patientName,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      } else {
        const result = await bookingCollection.insertOne(booking);
        return res.send({ success: true, result });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
