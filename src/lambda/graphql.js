const fetch = require("node-fetch").default;
const _ = require("lodash");

const API = "https://dog.ceo/api";

async function getDisplayImage(dog) {
  const results = await fetch(`${API}/breed/${breed}/images/random`);
  const { message: image } = await results.json();
  return image;
}

exports.handler = async (event, context, callback) => {
  const times = [];
  const startTime = +new Date();

  function recordTime(name) {
    times.push({ name, time: +new Date() - startTime });
  }

  recordTime("start");
  const results = await fetch(`${API}/breeds/list/all`);
  recordTime("first request received");
  const { message: dogs } = await results.json();
  recordTime("first request parsed");

  callback(null, {
    body: JSON.stringify(times),
    statusCode: 200
  });
};
