const path = require('path');
const { expect } = require('chai');
const rewiremock = require('rewiremock').default;
const SequelizeMock = require('./mocks/sequelize.mock');

rewiremock('mini-mvcs-readdir-sync').with((folder, ignoreList = []) => {
  return [
    'book.model.js',
    'author.model.js',
    'isbn.model.js',
    'tag.model.js',
    'ignore.model.js',
    'notamodel.js',
  ]
  .map((file) => {
    return path.resolve(folder, file);
  })
  .filter((fileName) => {
    return !ignoreList.some((ignoreParam) => {
      if (typeof ignoreParam === 'function') {
        return ignoreParam(fileName);
      }
      return path.resolve(folder, ignoreParam) === fileName;
    });
  });
});

let modelLoader;
let sequelizeInstance;

describe('Unit Testing model Loader', () => {
  before(() => {
    rewiremock.enable();
    modelLoader = require('../src/model-loader');
  });

  beforeEach(() => {
    sequelizeInstance = new SequelizeMock();
  });

  after(() => { rewiremock.disable(); });

  describe('load a model file', () => {
    it('should load a basic model file', (done) => {
      const db = modelLoader(sequelizeInstance, '.');
      expect(db).to.be.an('object');
      expect(db).to.have.property('models');
      expect(db).to.have.property('withTransaction');
      expect(db.models).to.be.an('object');
      expect(db.models).to.have.property('Book');
      expect(db.models).to.have.property('Author');
      expect(db.models).to.have.property('Isbn');
      expect(db.models).to.have.property('Tag');
      expect(db.models).to.have.property('Ignore');
      expect(db.models).to.have.property('Notamodel');
      done();
    });

    it('should use only .model suffixed files', (done) => {
      const db = modelLoader(sequelizeInstance, '.', [(f) => {
        return !f.endsWith('.model.js');
      }]);
      expect(db).to.be.an('object');
      expect(db).to.have.property('models');
      expect(db).to.have.property('withTransaction');
      expect(db.models).to.be.an('object');
      expect(db.models).to.have.property('Book');
      expect(db.models).to.have.property('Author');
      expect(db.models).to.have.property('Isbn');
      expect(db.models).to.have.property('Tag');
      expect(db.models).to.have.property('Ignore');
      expect(db.models).to.not.have.property('Notamodel');
      done();
    });

    it('should ignore certain files, even if suffixed properly', (done) => {
      const db = modelLoader(sequelizeInstance, '.', [
        'ignore.model.js',
        (f) => {
          return !f.endsWith('.model.js');
        },
      ]);
      expect(db).to.be.an('object');
      expect(db.models).to.have.property('Book');
      expect(db.models).to.have.property('Author');
      expect(db.models).to.have.property('Isbn');
      expect(db.models).to.have.property('Tag');
      expect(db.models).to.not.have.property('Ignore');
      expect(db.models).to.not.have.property('Notamodel');
      done();
    });
  });

  describe('assiociation tests', () => {
    // not testing importing a definition model again
    let db;
    before(() => {
      db = modelLoader(sequelizeInstance, '.', [(f) => { return !f.endsWith('.model.js'); }]);
    });

    // and using the following model for testing (which it is in the stub)
    // Author.hasMany(Book)
    // Book.belongsTo(Author)
    // Book.hasOne(Isbn)
    // Isbn.belongsTo(Book)
    // Book.belongsToMany(Tag)
    // Tag.belongsToMany(Book)
    // Notamodel does not have any relationships

    it('should load a model that only has a hasMany association', (done) => {
      expect(db.models.Author).to.have.property('hasManyModels');
      expect(db.models.Author.hasManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Author.hasManyModels).to.deep.include({
        model: db.models.Book, options: { as: 'books' },
      });
      // no other associations were executed
      ['belongsToModels', 'hasOneModels', 'belongsToManyModels'].forEach((assoc) => {
        expect(db.models.Author[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that only has a belongsTo association', (done) => {
      expect(db.models.Isbn).to.have.property('belongsToModels');
      expect(db.models.Isbn.belongsToModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Isbn.belongsToModels).to.deep.include({
        model: db.models.Book, options: { as: 'book' },
      });
      // no other associations were executed
      ['belongsToManyModels', 'hasOneModels', 'hasManyModels'].forEach((assoc) => {
        expect(db.models.Isbn[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that only has a belongsToMany association', (done) => {
      expect(db.models.Tag).to.have.property('belongsToManyModels');
      expect(db.models.Tag.belongsToManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Tag.belongsToManyModels).to.deep.include({
        model: db.models.Book, options: { as: 'bookTags' },
      });
      // no other associations were executed
      ['belongsToModels', 'hasOneModels', 'hasManyModels'].forEach((assoc) => {
        expect(db.models.Tag[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that has belongsTo, hasOne and belongsToMany associations', (done) => {
      expect(db.models.Book).to.have.property('belongsToModels');
      expect(db.models.Book.belongsToModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Book.belongsToModels).to.deep.include({
        model: db.models.Author, options: { as: 'author' },
      });
      expect(db.models.Book).to.have.property('hasOneModels');
      expect(db.models.Book.hasOneModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Book.hasOneModels).to.deep.include({
        model: db.models.Isbn, options: { as: 'isbn' },
      });
      expect(db.models.Book).to.have.property('belongsToManyModels');
      expect(db.models.Book.belongsToManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.models.Book.belongsToManyModels).to.deep.include({
        model: db.models.Tag, options: { as: 'bookTags' },
      });
      // no hasMany association was executed
      expect(db.models.Book.hasManyModels).to.be.an('Array').and.to.have.length(0);
      done();
    });

    it('should load a model with no associations at all', (done) => {
      expect(db.models.Ignore).to.have.property('belongsToModels');
      expect(db.models.Ignore).to.have.property('belongsToManyModels');
      expect(db.models.Ignore).to.have.property('hasOneModels');
      expect(db.models.Ignore).to.have.property('hasManyModels');
      [
        'belongsToManyModels',
        'belongsToModels',
        'hasOneModels',
        'hasManyModels',
      ].forEach((assoc) => {
        expect(db.models.Ignore[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });
  });
});
