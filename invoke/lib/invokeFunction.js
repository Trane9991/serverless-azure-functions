'use strict';

// const getAdminKey = require('../../shared/getAdminKey');
// const loginToAzure = require('../../shared/loginToAzure');
const BbPromise = require('bluebird');


module.exports = {
  invokeFunction () {
    const func = this.options.function;
    const functionObject = this.serverless.service.getFunction(func);

    var isHTTP = false;
    var isAnonymous = false;

    // checking if one of events is HTTP
    for (var i in functionObject.events) {
      for (var k in Object.keys(functionObject.events[i])) {
        if (Object.keys(functionObject.events[i])[k] == 'http') {
          isHTTP = true;
          isAnonymous = functionObject.events[i].hasOwnProperty("x-azure-settings") &&
                        functionObject.events[i]['x-azure-settings'].hasOwnProperty("authLevel") &&
                        functionObject.events[i]['x-azure-settings']['authLevel'] == 'anonymous'
        }
      }
    }

    if (isHTTP && isAnonymous) {
      console.log("HTTP anonymous")
      return this.provider.invokeWithHTTPEvent(func, this.options.data, isAnonymous)
    } else if (isHTTP) {
      console.log("HTTP")
      return BbPromise
          .then(() => this.serverless.cli.log('1'))
          .then(this.loginToAzure)
          .then(() => this.serverless.cli.log('2'))
          .then(this.getAdminKey)
          .then(() => this.serverless.cli.log('3'))
          .then(this.provider.invokeWithHTTPEvent(func, this.options.data, isAnonymous))
    } else {
      console.log("non-HTTP ")
      if (!this.options.data) {
        this.options.data = {}; 
      }
      return BbPromise.bind(this)
        .then(this.loginToAzure)
        .then(this.getAdminKey)
        .then(this.provider.invoke(func, this.options.data))
    }

    // TODO: Github issue: https://github.com/Azure/azure-webjobs-sdk-script/issues/1122
    // .then(() => this.provider.getInvocationId(func))
    // .then(() => this.provider.getLogsForInvocationId());
  }
};
