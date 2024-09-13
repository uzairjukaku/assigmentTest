const csvParser = (req, res, next) => {
    // Example of handling CSV before it reaches the controller
    // Perform validation, logging, etc. here
    next();
  };
  
  module.exports = { csvParser };
  