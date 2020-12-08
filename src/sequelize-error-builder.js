const { FieldError } = require('mini-mvcs-errors');

module.exports = (errors) => {
  return (errors.errors || []).map((err) => {
    return new FieldError(
      // TODO: check if path is the actual field
      err.path,
      // TODO: check if validatorKey is a i18n code for building the fieldError
      err.validatorKey,
      // TODO: check for all posible values of err.validatorArgs
      (err.value ? [err.value] : []).concat(err.validatorArgs || []),
    );
  });
};
