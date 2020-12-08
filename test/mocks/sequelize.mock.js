const Model = require('./model.mock');

class Sequelize {
  constructor(database, username, password, options) {
    this.database = database;
    this.username = username;
    this.password = password;
    this.options = options;
    this.models = [];
  }

  import(modelPath) {
    const importedModel = new Model(modelPath);
    this.models.push(importedModel);
    return importedModel;
  }
}

module.exports = Sequelize;
