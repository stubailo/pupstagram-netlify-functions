const { ApolloServer, gql } = require("apollo-server-lambda");
import { RESTDataSource } from "apollo-datasource-rest";
const { unique } = require("shorthash");
const { RedisCache } = require("../RedisCache");
const _ = require("lodash");

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    dogs: [Dog]
    dog(breed: String!): Dog
  }

  type Dog {
    id: String!
    breed: String!
    displayImage: String
    images: [Image]
    subbreeds: [String]
  }

  type Image {
    url: String!
    id: String!
  }
`;

const createDog = (subbreeds, breed) => ({
  breed,
  id: unique(breed),
  subbreeds: subbreeds.length > 0 ? subbreeds : null
});

class DogAPI extends RESTDataSource {
  baseURL = "https://dog.ceo/api";

  async didReceiveResponse(response) {
    if (response.ok) {
      const body = await this.parseBody(response);
      return body.message;
    } else {
      throw await this.errorFromResponse(response);
    }
  }

  async getDogs() {
    const dogs = await this.get(`breeds/list/all`);
    return _.map(dogs, createDog);
  }

  async getDog(breed) {
    const subbreeds = await this.get(`breed/${breed}/list`);
    return createDog(subbreeds, breed);
  }

  async getDisplayImage(breed) {
    return this.get(`breed/${breed}/images/random`);
  }

  async getImages(breed) {
    const images = await this.get(`breed/${breed}/images`);
    return images.map(image => ({ url: image, id: unique(image) }));
  }
}

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    dogs: async (root, args, { dataSources }) => {
      return dataSources.dogAPI.getDogs();
    },
    dog: async (root, { breed }, { dataSources }) => {
      return dataSources.dogAPI.getDog(breed);
    }
  },
  Dog: {
    displayImage: async ({ breed }, args, { dataSources }) => {
      return dataSources.dogAPI.getDisplayImage(breed);
    },
    images: async ({ breed }, args, { dataSources }) => {
      return dataSources.dogAPI.getImages(breed);
    }
  }
};

const options = {
  typeDefs,
  resolvers,
  dataSources: () => ({
    dogAPI: new DogAPI()
  })
};

if (process.env.ENGINE_API_KEY) {
  options.engine = { apiKey: process.env.ENGINE_API_KEY };
}

if (process.env.REDIS_URL) {
  options.cache = new RedisCache({
    url: process.env.REDIS_URL,
    retryStrategy: function(times) {
      console.log("Redis Retry", times);
      if (times >= 3) {
        return undefined;
      }
      var delay = Math.min(times * 50, 2000);
      return delay;
    },
    socket_keepalive: false
  });
}

const server = new ApolloServer(options);

const asHandler = server.createHandler({
  cors: {
    origin: "*",
    credentials: true,
    allowedHeaders: ["X-Apollo-Tracing", "Content-Type", "Authorization"]
  }
});

exports.handler = (event, context, callback) => {
  // console.log("handler start");
  // const cb = async (...args) => {
  //   console.log("fake callback called");
  //   if (options.cache) {
  //     console.log("closing cache");
  //     await options.cache.close();
  //   }
  //   console.log("about to call real callback");
  //   callback(...args);
  // };
  context.callbackWaitsForEmptyEventLoop = false;
  asHandler(event, context, callback);
};
