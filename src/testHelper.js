'use strict';
function TestHelper(ngMidWayTester) {
  this.tester = ngMidWayTester;
};

/**
* get current controller
**/
TestHelper.prototype.controller = function () {
  return this.tester.inject('$route').current.controller;
};

/**
* get actual scope, useful if page has been switched. It requires some element with ng-model on page to work.
**/
TestHelper.prototype.scope = function () {
  return angular.element($('[ng-model]')).scope();
};

/**
* get actual html of page. I found that ngMidWayTester.htmlElement does not work after page transitions
**/ 
TestHelper.prototype.html = function () {
  return document.body.outerHTML;
};

/* a necessary helper function to properly wait fo page transitions  */
TestHelper.prototype.wait = function (done) {
  var that = this,
    $timeout = that.tester.inject('$timeout');
  $timeout(function () {
    that.tester.digest();
    that.tester.stabilize(function () {
      $timeout(done);
    });
  });
};


/* some helper functions, I provide them just as case-example  for wait  function */
TestHelper.prototype.login = function (done) {
  var that = this;
  that.tester.visit('/login', function () {
    var scope = that.scope();
    scope.user = {username: 'user', password: 'pwd'};
    scope.submit();
    that.wait(done);
  });
};

/* try to logout from wherever you are */
TestHelper.prototype.logout = function (done) {
  var that = this;
  that.tester.visit('/', function () {
    if (that.tester.path() === '/login') {
      done();
      return;
    }
    var scope = that.scope();
    if (scope === null || scope === undefined) {
      //may be he was already not logged in, let's try with viewScope()...
      scope = that.tester.viewScope();
    }
    if (scope === null || scope === undefined) {
      console.log('Page:' + that.tester.path() + ' ctrl ' + that.controller() + ': no scope found');
      done();
      return;
    }
    scope.logout();
    that.wait(done);
  });
};
