const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.w0lxv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("doctors-portal").collection("services");
    const bookingCollection = client.db("doctors-portal").collection("bookings");

    app.get("/service", async (req, res) => {
      const query = req.body;
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray(cursor);
      res.send(result);
    })
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      console.log(booking)
      const query = {treatment: booking.treatment, date:booking.date,patientName:patientName}
      const result = await bookingCollection.insertOne(booking);
      return res.send({success:true,result});
    })

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
