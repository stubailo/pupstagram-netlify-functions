import * as Redis from "redis";
import { promisify } from "util";

export class RedisCache {
  constructor(options) {
    console.log("creating cache");
    this.defaultSetOptions = {
      ttl: 300
    };
    this.client = Redis.createClient(options);
    console.log("called create client");
    // promisify client calls for convenience
    this.client.get = promisify(this.client.get).bind(this.client);
    this.client.set = promisify(this.client.set).bind(this.client);
    this.client.flushdb = promisify(this.client.flushdb).bind(this.client);
    this.client.quit = promisify(this.client.quit).bind(this.client);

    this.client.on("error", () => {
      console.log("Error " + err);
    });

    this.client.on("connect", () => {
      console.log("connect");
    });

    this.client.on("reconnecting", object => {
      console.log("reconnecting", object);
    });

    this.client.on("end", () => {
      console.log("end");
    });
  }

  async set(key, data, options) {
    const { ttl } = Object.assign({}, this.defaultSetOptions, options);
    console.log("calling set", key);
    await this.client.set(key, data, "EX", ttl);
  }

  async get(key) {
    console.log("calling get", key);

    try {
      const reply = await this.client.get(key);
      console.log("get returned xxx");
      // reply is null if key is not found
      if (reply !== null) {
        return reply;
      }
      return;
    } catch (e) {
      console.log("error in get", e);
    }
  }

  async flush() {
    await this.client.flushdb();
  }

  async close() {
    await this.client.quit();
    return;
  }
}
