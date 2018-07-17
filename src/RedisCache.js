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

    this.client.on("error", function(err) {
      console.log("Error " + err);
    });
  }

  async set(key, data, options) {
    console.log("calling set");
    const { ttl } = Object.assign({}, this.defaultSetOptions, options);
    await this.client.set(key, data, "EX", ttl);
  }

  async get(key) {
    console.log("calling get");

    try {
      const reply = await this.client.get(key);
      console.log("get returned");
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
