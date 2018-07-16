const fetch = require("node-fetch").default;
const _ = require("lodash");

const API = "https://dog.ceo/api";

async function getDisplayImage(breed) {
  try {
    const results = await fetch(`${API}/breed/${breed}/images/random`);
    const { message: image } = await results.json();
    return image;
  } catch (e) {
    // lol
  }
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

  const imagePromises = Object.keys(dogs).map(async breed => {
    const image = await getDisplayImage(breed);
  });

  recordTime("made all promises");
  const result = await Promise.all(imagePromises);
  recordTime("fetched more dogs");

  callback(null, {
    body: JSON.stringify(times),
    statusCode: 200
  });
};
