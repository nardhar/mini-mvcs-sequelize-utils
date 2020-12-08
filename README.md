# Mini MVCS Sequelize Utils

Small library for loading models, providing basic CRUD operations and transforming errors for use with Mini MVCS Errors lib

Extracted first from Mini MVCS Library and from Node Backend Skel for individual use without any special dependencies.

## Features

- Synchronous loading of models building associations in order, so it does not create any additional fields when a hasMany association is called before a belongsTo one.
- Provides a withTransaction method for wrapping transactional calls to the database
- Provides the creation of a Service for CRUD Operations that:
  * Allow easy querying with associations (no "include" keyword needed in where)
  * Run synchronous and/or asynchronous validation functions before saving/updating data
  * Return either a ValidationError or a NotFoundError from the mini-mvcs-errors lib from all unsuccessful results for easy chaining.
- Provides an simple function for creating a ValidationError from a Sequelize Error object.

NOTE: it does not provide a dependency to Sequelize because it would lock your app to a version specified by this lib, instead it allows you to pick the version you want to work with and update it at anytime.

## Installation

Using npm:

```
npm install --save mini-mvcs-sequelize-utils
```

## Usage

### Model Loader

Reads a folder recursively for model loading with sequelize

```javascript
const Sequelize = require('sequelize');
const { modelLoader } = require('mini-mvcs-sequelize-utils');

const sequelize = new Sequelize(
  'database',
  'username',
  'password',
  // other params
);

// we could add transactional options here

// maybe you would like to ignore some files for loading
const filesToIgnoreArray = [];

const modelsLoadedInfo = modelLoader(sequelize, './models/', filesToIgnoreArray)

module.exports = {
  ...modelsLoadedInfo,
  sequelize,
};
```

### CRUD Service

Provides the creation of a CRUD lib based on a sequelize model:

```javascript
// book.crud-service.js
const { crudService } = require('mini-mvcs-sequelize-utils');
// using models from a modelLoader()
const { models } = require('./db');

const bookCrudService = crudService(models.Book);

module.exports = bookCrudService;
```

it provides the following methods:

#### 1. Persistence methods

**.create(properties)**

Creation of an Model Instance. It does not persist the instance, but it allows its creation in a consistent way, basically it is just a wrapper for the Model.build method from sequelize.

**.save(properties)**

Creation and saving of an Model Instance, throws a ValidationError if the save could not be executed (by internal validation or sequelize validation)

**.edit(id, properties)**

Reading and modifying the properties of a Model instance

**.update(id, properties)**

Reading, modifying and updating the properties of a Model instance, throws a ValidationError if the update could not be executed (by internal validation or sequelize validation)

**.delete(id)**

Deletion of a Model instance, throws a ValidationError if the save could not be executed (by internal validation or sequelize validation)

**.validate(modelInstance)**

Validation of a model, by default it is empty but it could be overwritten for adding more validation logic (asynchronous or not), throws a ValidationError (of course) if the validation could not be executed (by internal validation or sequelize validation)

#### 2. Querying methods

**.list(filter)**

Query a list of models according to the filter data, it provides some shortcuts for getting relationships in the same query, e.g.:

```js
// book.model
// ...
models.Book.associate = (models) => {
  models.Book.belongsTo(models.Author, {
    as: 'author',
    foreignKey: {
      name: 'idAuthor',
      field: 'id_author',
      allowNull: false,
    },
  });
};
// ...

// book.crud-service.js
// ...
// lists all books where author.name = 'JHON'
// no need to use the 'where' nor the 'include' keyword
bookCrudService.list({
  author: {
    name: 'JHON',
  },
});
// ...
```

**.listAndCount(filter)**

The same as list but it returns an object with **rows** (the result of the query) and **count** (the total count of the rows, for pagination) properties

**.find(filter)**

The same as list but it returns a single object, if not even one row that matches the filter could be found, then it throws a NotFoundError

**.read(id)**

The same as find but it uses the id (primaryKey) of the row for filtering

### SequelizeErrorBuilder

Sometimes you just want to use sequelize methods for saving or updating data, but want to keep the validation chain provided by ValidationError, in that case you can use sequelizeErrorBuilder for catching the error thrown by sequelize and build a ValidationError like this:

```javascript
const { sequelizeErrorBuilder } = require('mini-mvcs-sequelize-utils');
const { models } = require('./db');

module.exports = (properties) => {
  return models.book.save(properties)
  .catch((errors) => {
    throw new ValidationError('Book', sequelizeErrorBuilder(errors));
  });
};
```

## Examples and common usage

All examples for better usage are (or will be) at the [wiki](https://github.com/nardhar/mini-mvcs-sequelize-utils/wiki) of this project

## License

[MIT](https://github.com/nardhar/mini-mvcs-readdir-sync/blob/master/LICENSE)
