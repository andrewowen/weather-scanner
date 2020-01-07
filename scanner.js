import axios from "axios";
import cron from "node-cron";

const getRoad = async (arr, roadName) => {
  const roadToFind = await arr.filter(road => {
    return road.properties.name === roadName;
  });
  return roadToFind;
};

const getData = async roadName => {
  const res = await axios.get(
    "https://www.511virginia.org/data/geojson/icons.rwis.geojson"
  );
  const { features: roads } = res.data;
  const aftonMountainInfo = await getRoad(roads, roadName);
  const { properties } = aftonMountainInfo[0];
  return properties;
};

const printData = async () => {
  const { surface, name } = await getData("Afton Mountain");
  const { surface_temperature, surface_condition } = surface[0];
  console.log(surface_temperature.value);
  axios.post("http://localhost:9090/text", {
    number: "5408343982@msg.fi.google.com",
    message: `Weatherbot alert! \n
    Name: ${name}
    Surface Temp: ${surface_temperature.value}
    Surface Condition: ${surface_condition.value} \n
    Be safe!`
  });
};

const task = cron.schedule(
  "30 16 * * Monday-Friday",
  () => {
    printData();
  },
  {
    scheduled: true,
    timezone: "America/New_York"
  }
);

const isValid = cron.validate("30 16 * * Monday-Friday");
console.log(isValid);

task.start();
