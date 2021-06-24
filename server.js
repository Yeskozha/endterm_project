const express = require("express")
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const https = require('https');

app.use(bodyParser.urlencoded({
  extened: true
}))
app.use(express.static('public'))
app.set("view engine", "ejs")
mongoose.connect('mongodb://localhost:27017/News_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

const newsSchema = new mongoose.Schema({
  title: String,
  date: Date,
  category: String,
  topic: String,
  description: String
});

const News = mongoose.model("news", newsSchema);
var weatherApi = {};
var ExternalNews = [];

app.get("/", function(req, res) {
  var city = "Petropavlovsk"
  apiKey = "07e6be11058f287f345016199616cd77";
  url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + apiKey + "&units=metric";
  https.get(url, function(response) {
    response.on("data", function(data) {
      var weather = JSON.parse((data));
      var country = weather.sys.country;
      weatherApi = {
        name: weather.name,
        country: country,
        flagUrl: "http://openweathermap.org/images/flags/" + country.toLowerCase() + ".png",
        weather: weather.weather[0].description,
        temp: weather.main.temp,
        temp_min: weather.main.temp_min,
        temp_max: weather.main.temp_max,
        speed: weather.wind.speed,
      }
    })
  })

  News.find(function(err, foundNews) {
    var apiKey = "3976a488bb114a32838485ead45390a1"
    url = "https://newsapi.org/v2/sources?language=en&apiKey=3976a488bb114a32838485ead45390a1";
    https.get(url, function(response) {
      const chunks = []
      response.on('data', function(chunk) {
        chunks.push(chunk)
      })
      response.on('end', function() {
        const data = Buffer.concat(chunks)
        var got = JSON.parse(data)
        res.render("news", {
          ...weatherApi,
          List_of_news: foundNews,
          externalList: got.sources
        });
        ExternalNews = foundNews.concat(got.sources);
      })
    })
  })
})

app.get("/eldyiar", function(req, res) {
  res.render("insertion_form");
})

app.post("/insertion", function(req, res) {
  const title = req.body.title
  date = req.body.date
  category = req.body.category
  topic = req.body.topic
  description = req.body.description;
  const inserting = new News({
    title: title,
    date: date,
    category: category,
    topic: topic,
    description: description
  })
  inserting.save()
  res.redirect("/")
})

app.post("/edit", function(req, res) {
  const option = req.body.button
  changeId = req.body.id;
  if (option == "delete") {
    News.deleteOne({
      _id: changeId
    }, function() {
      res.redirect("/")
    })
  } else {
    News.findOne({
      _id: changeId
    }, function(err, block) {
      res.render("change", {
        id: block._id,
        title: block.title,
        date: block.date,
        topic: block.topic,
        description: block.description,
      })
    })
  }
})

app.post("/change", function(req, res) {
  News.findOneAndUpdate({
    _id: req.body.id
  }, {
    $set: {
      title: req.body.title,
      category: req.body.category,
      date: req.body.date,
      topic: req.body.topic,
      description: req.body.description
    }
  }, function() {
    res.redirect("/")
  })
})

app.listen(5000, function() {
  console.log("localhost:5000");
})
