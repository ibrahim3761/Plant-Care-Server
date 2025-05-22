const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.thvamxq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const plantCollection = client.db("platnDB").collection("plants");

    app.get("/plants", async (req, res) => {
      const sortBy = req.query.sortBy;

      if (sortBy === "nextWatering") {
        const result = await plantCollection
          .aggregate([
            {
              $addFields: {
                nextWateringDate: { $toDate: "$nextWatering" },
              },
            },
            {
              $sort: { nextWateringDate: 1 },
            },
          ])
          .toArray();

        res.send(result);
      } else {
        const result = await plantCollection.find().toArray();
        res.send(result);
      }
    });
    app.get("/plants/recent", async (req, res) => {
      const result = await plantCollection
        .find()
        .sort({ _id: -1 }) 
        .limit(6) 
        .toArray();
      res.send(result);
    });

    app.get("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantCollection.findOne(query);
      res.send(result);
    });

    app.get("/plants/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await plantCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/plants", async (req, res) => {
      const plant = req.body;
      const result = await plantCollection.insertOne(plant);
      res.send(result);
    });

    app.put("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPlant = req.body;
      const updatedDoc = {
        $set: updatedPlant,
      };
      const result = await plantCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.delete("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
