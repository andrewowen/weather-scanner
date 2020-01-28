import axios from "axios";
import cron from "node-cron";

const WEATHER_URL =
  "https://www.511virginia.org/data/geojson/icons.rwis.geojson";
const SMS_SERVER_URL = "http://localhost:9090/text";
const SMS_SERVER_DATA = (name, temp, condition, visibility) => {
  return {
    number: "5408343982@msg.fi.google.com",
    message: `Weatherbot alert! \n \n Name: ${name} \n Surface Temp: ${temp}°F \n Surface Condition: ${condition} \n Visibility: ${visibility} \n Road Cam Picture: \n https://images.skyvdn.com/thumbs/StauntonCCTV64102E.flv.png \n \n Be safe!`
  };
};

// filters out all the roads I don't care about from the roads array
const getRoad = async (arr, roadName) => {
  const roadToFind = await arr.filter(road => {
    return road.properties.name === roadName;
  });
  return roadToFind;
};

// makes request to 511 and returns properties for the road returned from getRoad
const getData = async roadName => {
  const res = await axios.get(WEATHER_URL);
  const { features: roads } = res.data;
  const aftonMountainInfo = await getRoad(roads, roadName);
  const { properties } = aftonMountainInfo[0];
  return properties;
};

// sends out the information I care about returned from getData to an SMS
const printData = async () => {
  const { surface, name, atmos } = await getData("Afton Mountain");
  const { surface_temperature, surface_condition } = surface[0];
  const { visibility } = atmos[0];
  let visibilityRate = "no visibility reported";
  visibility && visibility.value < 0.3
    ? (visibilityRate = "it mad foggy")
    : (visibilityRate = "you'll be okay");
  const temp = surface_temperature
    ? surface_temperature.value.substring(0, 2)
    : "no surface temperature reported";
  const condition = surface_condition
    ? surface_condition.value
    : "no surface condition reported";
  console.log("Sending text...");
  axios.post(
    SMS_SERVER_URL,
    SMS_SERVER_DATA(name, temp, condition, visibilityRate)
  );
};

// runs Mon-Friday at 4:00PM EST ⏰
const task = cron.schedule(
  "30 7 * * Monday-Friday",
  () => {
    console.log("WeatherBot™ - Gathering data...");
    printData();
  },
  {
    // will make sure CRON job continues after execution
    scheduled: true,
    timezone: "America/New_York"
  }
);

console.log("Listening for tasks... 🎧");
// printData();
task.start();
