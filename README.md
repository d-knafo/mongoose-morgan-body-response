# mongoose-morgan-body-response
[![NPM](https://nodei.co/npm/mongoose-morgan.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/mongoose-morgan/)

Is an npm package which is combining [mongoose](https://www.npmjs.com/package/mongoose) and [morgan](https://www.npmjs.com/package/morgan) packages by adding an additional functionality to log morgan data into MongoDB.

# Install

To install this package just run:

`npm install mongoose-morgan-body-response`

# Basic usage example

Here is an example of using mongoose-morgan-body-response together with the express app:

```
// express
const express = require('express');
const app = express();
const originalSend = app.response.send

app.response.send = function sendOverWrite(body) {
  originalSend.call(this, body)
  this.__custombody__ = body
}

// mongoose-morgan-body-response
const morgan = require('mongoose-morgan-body-response');

// connection-data
const port = process.env.port || 8080;

// Logger
app.use(morgan({
    connectionString: 'mongodb://localhost:27017/logs-db'
}));

// run
app.listen(port);
console.log('works... ' + port);
```

The example from the above will create inside `logs-db` database collection called `logs` and will store data inside it.

# Detailed usage

[mongoose-morgan-body-response](https://www.npmjs.com/package/mongoose-morgan-body-response) is accepting three parameters:

- mongoData : object type with next properties
  - required {string} connectionString
    > - optional {string} collection
    > - optional {string} user
    > - optional {string} pass
    > - optional {bool} capped ([pull req](https://github.com/nemanjapetrovic/mongoose-morgan/pull/2) by @Ni55aN)
    > - optional {int} cappedSize ([pull req](https://github.com/nemanjapetrovic/mongoose-morgan/pull/2) by @Ni55aN)
    > - optional {int} cappedMax ([pull req](https://github.com/nemanjapetrovic/mongoose-morgan/pull/2) by @Ni55aN)
    > - optional {string} dbName ([pull req](https://github.com/nemanjapetrovic/mongoose-morgan/pull/5) by @pmstss)
    > - optional {bool} useNewUrlParser (default: true)
    > - optional {bool} useUnifiedTopology (default: true) ([issue #8](https://github.com/d-knafo/mongoose-morgan-body-response/issues/8))
- options : object type - [standrad morgan options](https://github.com/expressjs/morgan#options)
- format : string type - [standrad mrogan format](https://github.com/expressjs/morgan#predefined-formats)

Example without morgan options:

```
app.use(morgan({
    connectionString: 'mongodb://localhost:27017/logs-db'
   }, {}, 'short'
));
```

Full example:

```
app.use(morgan({
    collection: 'error_logger',
    connectionString: 'mongodb://localhost:27017/logs-db',
    user: 'admin',
    pass: 'test12345'
   },
   {
    skip: function (req, res) {
        return res.statusCode < 400;
    }
   },
    ':method :url :status :response-time ms - :res[content-length] :body - :req[content-length]'
));
```

If you want to store data in db in seperate fields,

format: `':method === :url === :status === :response-time ms === :res[content-length] === :body === :resBody === :req[content-length]'`

Data will store in following format in DB:

```
        date: {
            type: Date,
            default: Date.now
        },
        log: String,
        endpoint: String,
        method: String,
        bodySize: String,
        responseCode: String,
        responseTime: String,
        requestBody: Object,
        responseBody: Object,
```

The code above will log only data in `dev` format and will skip all the logs if the response status code is less than 400. Data will be stored in `logs-db` database in `error_logger` collection.

# [Contribution](https://github.com/d-knafo/mongoose-morgan-body-response/blob/master/CONTRIBUTING.md)

Feel free to contribute by forking this repository, making some changes, and submitting pull requests. For any questions or advice place an issue on this repository.

# License

[MIT](LICENSE)
