const mongoose = require("mongoose");
const morgan = require("morgan");
const stream = require("stream");
const carrier = require("carrier");
const passStream = new stream.PassThrough();

let logSchema;

/**
 * MongooseMorgan object
 * @param  {object} mongoData - represents mongo database data, requires { connectionString : '{MONGO_URL}' } parameter.
 * @param  {object} options - represents morgan options, check their github, default value is empty object {}.
 * @param  {string} format - represents morgan formatting, check their github, default value is 'combined'.
 */
function MongooseMorgan(mongoData, options, format) {
  // Filter the arguments
  var args = Array.prototype.slice.call(arguments);
  morgan.token("body", (req, res) => JSON.stringify(req.body));
  morgan.token("resBody", (req, res) => {
    return JSON.stringify(res.__custombody__);
  });
  morgan.token("uuid", (req, res) => {
    return req.uuid;
  });

  if (args.length == 0 || !mongoData.connectionString) {
    throw new Error(
      "Mongo connection string is null or empty. Try by adding this: { connectionString : '{mongo_url}'}"
    );
  }

  if (args.length > 1 && typeof options !== "object") {
    throw new Error(
      "Options parameter needs to be an object. You can specify empty object like {}."
    );
  }

  if (args.length > 2 && typeof format === "object") {
    throw new Error(
      "Format parameter should be a string. Default parameter is 'combined'."
    );
  }

  options = options || {};
  format = format || "combined";

  // Create connection to MongoDb
  var collection = mongoData.collection || "logs";
  var capped = mongoData.capped;
  var cappedSize = mongoData.cappedSize || 10000000;
  var cappedMax = mongoData.cappedMax;

  mongoose.connect(mongoData.connectionString, {
    user: mongoData.user || null,
    pass: mongoData.pass || null,
    dbName: mongoData.dbName || null,
    useNewUrlParser: mongoData.useNewUrlParser || true,
    useUnifiedTopology: mongoData.useUnifiedTopology || true,
  });

  // Create stream to read from
  var lineStream = carrier.carry(passStream);
  lineStream.on("line", onLine);

  // Morgan options stream
  options.stream = passStream;

  // Schema - only once created.
  if (!logSchema) {
    logSchema = mongoose.Schema(
      {
        date: {
          type: Date,
          default: Date.now,
        },
        uuid: String,
        log: String,
        endpoint: String,
        method: String,
        bodySize: String,
        responseCode: String,
        responseTime: Number,
        requestBody: Object,
        responseBody: Object,
      },
      capped
        ? {
            capped: {
              size: cappedSize,
              max: cappedMax,
            },
          }
        : {}
    );
  }

  // Create mongoose model
  var Log = mongoose.model("Log", logSchema, collection);

  function onLine(line) {
    const extractIt = line.split("===");
    try {
      console.log(extractIt.slice(0, 4).join("-"));
    } catch (err) {
      console.log("Error from mongoose-morgan-body:", err);
    }

    var logModel = new Log();
    logModel.uuid = extractIt[8].trim() || "";
    logModel.log = line;
    logModel.method = extractIt[0].trim() || "";
    logModel.endpoint = extractIt[1].trim() || "";
    logModel.responseCode = extractIt[2].trim() || "";
    logModel.responseTime =
      parseFloat(extractIt[3].trim().replace(/[^\d.-]/g, "")) || "";
    logModel.bodySize = extractIt[4].trim() || "";
    logModel.requestBody = "";

    try {
      logModel.requestBody = JSON.parse(extractIt[5]) || {};
    } catch {
      logModel.requestBody = {};
    }

    try {
      logModel.responseBody = extractIt[6] || {};
    } catch {
      logModel.responseBody = {};
    }

    logModel.save(function (err) {
      if (err) {
        throw err;
      }
    });
  }

  var mongooseMorgan = morgan(format, options);
  return mongooseMorgan;
}

module.exports = MongooseMorgan;
module.exports.compile = morgan.compile;
module.exports.format = morgan.format;
module.exports.token = morgan.token;
