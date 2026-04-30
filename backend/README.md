# nodejs-express-jwt

> Express REST API Boilerplate with JWT Authentication and support for MySQL and PostgreSQL.

- Compilation via [Babel](https://babeljs.io/);
- Authentication via [JWT](https://jwt.io/);
- Routes mapping via [express-routes-mapper](https://github.com/aichbauer/express-routes-mapper);
- Environments for `development`, `testing`, and `production`.

## Table of Contents

- [Version notice](#version-notice)
- [Install & Use](#install-and-use)
- [Controllers](#controllers)
  - [Create a Controller](#create-a-controller)
- [Models](#models)
  - [Create a Model](#create-a-model)
- [Policies](#policies)
- [Services](#services)
- [Configs](#configs)
  - [.env](#.env-file)
- [npm scripts](#npm-scripts)
- [License]()

## Version notice

This project came a long way since the initial release in 2018. If you used this boilerplate before 2021, you should check a [v0.x.x branch](https://github.com/MarkKhramko/nodejs-express-jwt/tree/v0.x.x) and [v0 tags](https://github.com/MarkKhramko/nodejs-express-jwt/releases/tag/v0.0.0) for the latest changes of v0.

## Install and Use

Start by cloning this repository

```sh
# HTTPS
$ git clone https://github.com/MarkKhramko/nodejs-express-jwt
```

then use [npm](https://www.npmjs.com/) to

```sh
# Enter project root
cd nodejs-express-jwt

# Install dependencies
npm i

# Copy environment file
cp .env.example .env
# Create environment-specific files
cp .env.example .env.development
cp .env.example .env.production
# Fill the files you need
# ...

# If you want to use PostgreSQL (optional)
npm i -S pg pg-hstore

# Start the application (without code watcher)
npm start
#
# OR
#
# start development with nodemon
npm run dev
```

MySQL is supported out of the box as it is the default.

## Controllers

Controllers in this boilerplate have a naming convention: `ModelnameController.js` and uses an object factory pattern.
To use a model inside of your controller you have to require it.
We use [Sequelize](http://docs.sequelizejs.com/) as ORM, if you want further information read the [Docs](http://docs.sequelizejs.com/).

### Folder structure

* Controllers for your main API should be placed inside `/api/` directory;
* Controllers for HTTP requests should be placed inside `/web/`  directory.

### Create a Controller

Example Controller for all **CRUD** oparations:

```js
const Model = require('#models/Model');

model.exports = function ModelController() {
  const _create = (req, res) => {
    // body is part of a form-data
    const { value } = req.body;

    Model
      .create({
        key: value
      })
      .then((model) => {
        if(!model) {
          return res.status(400).json({ msg: 'Bad Request: Model not found' });
        }

        return res.status(200).json({ model });
      })
      .catch((err) => {
        // better save it to log file
        console.error(err);

        return res.status(500).json({ msg: 'Internal server error' });
      });
  };

  const _getAll = (req, res) => {
    Model
      .findAll()
      .then((models) => {
        if(!models){
          return res.status(400).json({ msg: 'Bad Request: Models not found' });
        }

        return res.status(200).json({ models });
      })
      .catch((err) => {
        // better save it to log file
        console.error(err);

        return res.status(500).json({ msg: 'Internal server error' });
      });
  };

  const _get = (req, res) => {
    // params is part of an url
    const { id } = req.params;

    Model
      .findOne({
        where: {
          id,
        },
      })
      .then((model) => {
        if(!model) {
          return res.status(400).json({ msg: 'Bad Request: Model not found' });
        }

        return res.status(200).json({ model });
      })
      .catch((err) => {
        // better save it to log file
        console.error(err);

        return res.status(500).json({ msg: 'Internal server error' });
      });
  };

  const _update = (req, res) => {
    // params is part of an url
    const { id } = req.params;

    // body is part of form-data
    const { value } = req.body;

    Model
      .findByPk(id)
      .then((model) => {
        if(!model) {
          return res.status(400).json({ msg: 'Bad Request: Model not found' });
        }

        return model
          .update({
            key: value,
          }).then((updatedModel) => {
            return res.status(200).json({ updatedModel });
          });
      })
      .catch((err) => {
        // better save it to log file
        console.error(err);

        return res.status(500).json({ msg: 'Internal server error' });
      });
  };

  const _destroy = (req, res) => {
    // params is part of an url
    const { id } = req.params;

    Model
      .findByPk(id)
      .then((model) => {
        if(!model) {
          return res.status(400).json({ msg: 'Bad Request: Model not found' })
        }

        model.destroy().then(() => {
          return res.status(200).json({ msg: 'Successfully destroyed model' });
        }).catch((err) => {
          // better save it to log file
          console.error(err);

          return res.status(500).json({ msg: 'Internal server error' });
        });
      })
      .catch((err) => {
        // better save it to log file
        console.error(err);

        return res.status(500).json({ msg: 'Internal server error' });
      });
  };

  // !IMPORTANT!
  // don't forget to return the functions:
  return {
    create: _create,
    getAll: _getAll,
    get: _get,
    update: _update,
    destroy: _destroy
  };
};
```

## Models

Models in this boilerplate have a naming convention: `Model.js` and uses [Sequelize](http://docs.sequelizejs.com/) to define Models, if you want further information read the [Docs](http://docs.sequelizejs.com/).

### Create a Model

Example User Model:

```js
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

// Password hasher.
const bcryptSevice = require('#services/bcrypt.service');


const User = database.define(
  'User',
  {
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
  }
);

// Hooks:
User.beforeValidate((user, options) => {
  // Hash user's password.
  user.password = bcryptSevice.hashPassword(user);
})
// Hooks\

module.exports = User;
```

## Policies

Policies are middleware functions that can run before hitting a apecific or more specified route(s).


## Services

Services are little useful snippets, or calls to another API that are not the main focus of your API.

Example service:

Get comments from another API:

```js
module.exports = {
  getComments:_getComments
};

async function _getComments() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/comments', {
      method: 'get'
    });
    // do some fancy stuff with the response.
  }
  catch(error) {
    // Process error.
  }
}
```

## Configs

### .env files

#### Database

Configure shared defaults in `.env`.
Configure local development in `.env.development`.
Configure production in `.env.production`.

The backend loads `.env` first and then overrides it with `.env.<NODE_ENV>` when that file exists.

```
DB_DIALECT=mysql
DB_HOST=localhost
DB_NAME=name
DB_USER=root
DB_PASSWORD=root
DB_PORT=3609
```

Default dialect for the application is MySQL. To switch for PostgreSQL, type `DB_DIALECT=postgres` in `.env` file.

> Note: if you use `mysql` make sure MySQL server is running on the machine

> Note: to use a postgres run : `npm i -S pg pg-hstore` or `yarn add pg pg-hstore`

#### JWT

Set random `secret access keys` for your access and refresh tokens.

```
JWT_ACCESS_SECRET=<any random string>
JWT_REFRESH_SECRET=<any random string>
```

## npm scripts

### `npm run dev`

This is the entry for a developer. This command:

- runs **nodemon watch task** for the all files conected to `.app/app.js`, except `./public` directory;
- Reads **environment variable** `NODE_ENV` from `.env`;
- Opens the db connection for `development`;
- Starts the server on 127.0.0.1:APP_PORT,

### `npm run production`

This command:

- Sets the **environment variable** to `production`;
- Opens the db connection for `production`;
- Starts the server on 127.0.0.1:APP_PORT.

Before running on production you have to set the **environment vaiables**:

- APP_PORT - Port for your application (usually `80`);
- DB_DIALECT - `mysql` or `postgres`l;
- DB_HOST - Host address of your database;
- DB_NAME - Database name for production;
- DB_USER - Database username for production;
- DB_PASS - Database password for production;
- DB_PORT - Database port for production;
- JWT_ACCESS_SECRET - Secret for JSON web token for direct API requests;
- JWT_REFRESH_SECRET - Secret for JSON web token to renew the Access-JWT.

### `npm start`

- Opens the db connection for default environment in `.env` file.
- Simply start the server on 127.0.0.1:APP_PORT without a watcher.


### `npm run db:migrate`

- Ensures that database schemas are equivalent to the ones configured in `/app/models/index.js`.


### `npm run db:seed`

- Inserts all seeds, configured in `/migrator/seeder.js` into the database.


## License
[MIT](LICENSE)

## Copyright
Copyright 2018-present [Mark Khramko](https://github.com/MarkKhramko)
