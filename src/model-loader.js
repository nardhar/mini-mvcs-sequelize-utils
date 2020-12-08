const readdirSync = require('mini-mvcs-readdir-sync');

module.exports = (sequelizeInstance, modelsPath, ignoreList = []) => {
  const models = {};

  const db = {};
  const fakeDb = {};

  // the list for saving the associations before running the actual associations
  const associationList = {
    belongsTo: [],
    hasOne: [],
    belongsToMany: [],
    hasMany: [],
  };

  // the order to execute associations
  const associationListOrder = ['belongsTo', 'hasOne', 'belongsToMany', 'hasMany'];

  readdirSync(modelsPath, ignoreList)
  .forEach((modelFile) => {
    const model = sequelizeInstance.import(modelFile);
    db[model.name] = model;
    // building the fake associator
    fakeDb[model.name] = associationListOrder.reduce((acc, associationType) => {
      return {
        ...acc,
        [associationType]: (model2, options) => {
          associationList[associationType].push({
            model1: model.name,
            model2: model2.name,
            options,
          });
        },
      };
    }, { name: model.name });
  });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      // sending fakeDb so it only adds the association's definition to associationList key array
      db[modelName].associate(fakeDb);
    }
  });

  // and now we associate the models in the order specified in associationListOrder
  // this is made to make sure no additional keys are created when a hasMany association is called
  // before a belongsTo one
  associationListOrder.forEach((associationType) => {
    associationList[associationType].forEach((association) => {
      db[association.model1][associationType](db[association.model2], association.options);
    });
  });

  // adds the mapped model to the exported models object
  Object.keys(db).forEach((model) => {
    models[model] = db[model];
  });

  return {
    models,
    withTransaction(callback, isTransactional = true) {
      return isTransactional
        ? sequelizeInstance.transaction(callback)
        : Promise.resolve(callback());
    },
  };
};
