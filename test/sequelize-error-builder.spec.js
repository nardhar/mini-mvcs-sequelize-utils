const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

class FieldError {
  constructor(field, code, args) {
    this.code = code;
    this.field = field;
    this.args = args;
  }
}

rewiremock('mini-mvcs-errors').with({
  FieldError,
});

let sequelizeErrorBuilder;

describe('Unit Testing file Util module', () => {
  before(() => {
    rewiremock.enable();
    sequelizeErrorBuilder = require('../src/sequelize-error-builder');
  });

  after(() => { rewiremock.disable(); });

  it('should build an array without length if no errors are sent', (done) => {
    const fieldErrorList = sequelizeErrorBuilder({
      errors: [],
    });
    expect(fieldErrorList).to.have.length(0);
    done();
  });

  it('should build an array of FieldError', (done) => {
    const fieldErrorList = sequelizeErrorBuilder({
      errors: [
        {
          path: 'myfield',
          validatorKey: 'invalid',
        },
        {
          path: 'otherfield',
          validatorKey: 'null',
          value: -2,
          validatorArgs: [0],
        },
      ],
    });
    expect(fieldErrorList).to.have.length(2);
    expect(fieldErrorList[0]).to.have.property('field');
    expect(fieldErrorList[0]).to.have.property('code');
    expect(fieldErrorList[0]).to.have.property('args');
    expect(fieldErrorList[0].field).to.equal('myfield');
    expect(fieldErrorList[0].code).to.equal('invalid');
    expect(fieldErrorList[0].args).to.be.an.instanceof(Array);
    expect(fieldErrorList[0].args).to.have.length(0);
    expect(fieldErrorList[1]).to.have.property('field');
    expect(fieldErrorList[1]).to.have.property('code');
    expect(fieldErrorList[1]).to.have.property('args');
    expect(fieldErrorList[1].field).to.equal('otherfield');
    expect(fieldErrorList[1].code).to.equal('null');
    expect(fieldErrorList[1].args).to.be.an.instanceof(Array);
    expect(fieldErrorList[1].args).to.have.length(2);
    expect(fieldErrorList[1].args).to.deep.include(-2);
    expect(fieldErrorList[1].args).to.deep.include(0);
    done();
  });
});
