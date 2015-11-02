var expect = chai.expect;

describe('ngMidwayTester', function() {

  var tester,
      noop = angular.noop,
      appName = 'MyMod';

  afterEach(function() {
    if(tester) {
      tester.destroy();
      tester = null;
    }
  });

  it('should register a module', function() {
    var example = angular.module(appName, [])
      .run(function($rootScope) {
        $rootScope.value = 'true';
      });

    tester = ngMidwayTester(appName);
    expect(tester.module()).to.equal(example);
    expect(tester.rootScope().value).to.equal('true');
  });

  it('should inject services', function() {
    var $location, $window, $compile, $injector;
    var example = angular.module(appName, [])
      .run(function(_$compile_, _$window_, _$location_, _$injector_) {
        $location = _$location_;
        $window = _$window_;
        $compile = _$compile_;
        $injector = _$injector_;
      });

    tester = ngMidwayTester(appName);
    expect(tester.injector()).to.equal($injector);
    expect(tester.inject('$location')).to.equal($location);
    expect(tester.inject('$compile')).to.equal($compile);
    expect(tester.inject('$window')).to.equal($window);
  });

  describe('template options', function() {
      it('should use a custom index.html template string', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              })
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $stateProvider
                      .state('path2', {
                          url: '/path2',
                          controller: function ($scope) {
                              this.woof = 'hello';
                          },
                          controllerAs: 'dog',
                          template: 'two {{dog.woof}}'
                      })
              });


          tester = ngMidwayTester(appName, {
              template: '<h1>title</h1>' +
              '<div ui-view></div>'
          });
          expect(tester.module()).to.equal(example);
          expect(tester.rootScope().value).to.equal('true');

          tester.visit('/path2');
          tester.waitForControllerInViewScope(function () {
              expect(tester.path()).to.equal('/path2');
              expect(tester.viewElement().text()).to.contain('two');
              expect(tester.viewElement().text()).to.contain('hello');
              expect(tester.currentState().controllerAs).to.equal('dog');
              done();
          },null,'dog')();
      });

      it('should use a custom index.html template file', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              })
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $stateProvider
                      .state('path-10', {
                          url: '/path-10',
                          controller: function ($scope) {
                              $scope.page = 'ten';
                          },
                          template: 'ten'
                      })
              });
          tester = ngMidwayTester(appName, {
              templateUrl: './test/spec/custom-view.html'
          });

          expect(tester.module()).to.equal(example);
          expect(tester.rootScope().value).to.equal('true');

          tester.visit('/path-10');
          tester.waitForViewScopeCondition(function () {
              expect(tester.path()).to.equal('/path-10');
              var html = tester.rootElement().html();
              expect(html).to.contain('<main id="container">');
              expect(html).to.contain('ten');
                  var viewEl = tester.viewElement().html();
                  expect(viewEl).to.contain('ten');
              done();
          },null,
          function(scope){
              return scope.page;
          })();
      });

      it('should use a custom index.html template file with nested views', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              })
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $urlRouterProvider.otherwise("/nested");
                  $locationProvider.html5Mode(false).hashPrefix('!');
                  $stateProvider
                      .state('nested', {
                          url: '/nested',

                          views:{
                              '':{
                                  controller: function ($scope) {
                                      this.page = 'ten';
                                  },
                                  controllerAs:'dog'
                              },
                              'main@nested':{
                                  template:'MainContent'
                              },
                              'secondary@nested':{
                                  template:'SecondaryContent'
                              }
                          }
                      })
              });


          tester = ngMidwayTester(appName, {
              templateUrl: './test/spec/custom-view2.html'
          });

          expect(tester.module()).to.equal(example);
          expect(tester.rootScope().value).to.equal('true');

          tester.visit('/nested');
          tester.waitForViewScopeCondition(function () {
              expect(tester.path()).to.equal('/nested');
              var html = tester.viewElement().html();
              expect(html).to.contain('Nice view');
              expect(html).to.contain('MainContent');
              done();
          },null,function(scope){
              return scope.dog && scope.dog.page;
          })();
      });

      it('should get data from nested views', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              })
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $urlRouterProvider.otherwise("/nested");
                  $locationProvider.html5Mode(false).hashPrefix('!');
                  $stateProvider
                      .state('nested', {
                          url: '/nested',
                          views: {
                              '':{
                                  controller: function ($scope) {
                                      this.page = 'ten';
                                  },
                                  controllerAs:'cat'
                              },
                              'main@nested': {
                                  template: 'MainContent'
                              },
                              'secondary@nested': {
                                  templateUrl: './test/spec/custom-view4.html'
                              },
                              'main3@nested': {
                                  template: 'hot content'
                              },
                              'secondary3@nested': {
                                  templateUrl: './test/spec/custom-view3.html'
                              },
                              'blue@nested': {
                                  template: 'I like blue'
                              },
                              'red@nested': {
                                  template: 'I also like red'
                              }
                          }
                      })
              });


          tester = ngMidwayTester(appName, {
              templateUrl: './test/spec/custom-view2.html'
          });

          expect(tester.module()).to.equal(example);
          expect(tester.rootScope().value).to.equal('true');

          tester.visit('/nested');
          tester.waitForControllerInViewScope(function () {
              expect(tester.path()).to.equal('/nested');
              var htmlMain = tester.viewElement('main').html();
              expect(htmlMain).to.contain('MainContent');
              var htmlSecondary = tester.viewElement('secondary').html();
              expect(htmlSecondary).to.contain('Bad view');
              var htmlSecondaryMain = tester.viewElement(['secondary', 'main3']).html();
              expect(htmlSecondaryMain).to.contain('hot content');
              var htmlBlueSecondaryMain = tester.viewElement(['secondary', 'secondary3', 'blue']).html();
              expect(htmlBlueSecondaryMain).to.contain('I like blue');
              var htmlRedSecondaryMain = tester.viewElement(['secondary', 'secondary3', 'red']).html();
              expect(htmlRedSecondaryMain).to.contain('I also like red');
              done();
          },null,'cat')();


      });


      it('should throw an error when a file downloaded from templateUrl is not found', function () {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              })
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $urlRouterProvider.otherwise("/path-10");
                  $locationProvider.html5Mode(false).hashPrefix('!');

                  $stateProvider
                      .state('path-10', {
                          url: '/path-10',
                          controller: function ($scope) {
                              $scope.page = 'ten';
                          },
                          template: 'ten'
                      })
              });


          var fn = function () {
              tester = ngMidwayTester(appName, {
                  templateUrl: '../../some-file.html'
              });
          };

          expect(fn).to.throw('ngMidwayTester: Unable to download template file');
      });
  });

  describe('scope', function() {
    it('should perform an eval async operation', function() {
      var example = angular.module(appName, [])
        .run(function($rootScope) {
          $rootScope.value = 1;
        });

      tester = ngMidwayTester(appName);
      tester.evalAsync(function() {
        tester.rootScope().value = 2;
      });

      expect(tester.rootScope().value).to.equal(1);
      tester.digest();
      expect(tester.rootScope().value).to.equal(2);
    });

    it('should compile and link html code', function() {
      var example = angular.module(appName, [])
        .run(function($rootScope) {
          $rootScope.value = 'one';
        });

      tester = ngMidwayTester(appName);
      var element = tester.compile('<div>{{ value }}</div>');
      expect(element.html()).not.to.equal('one');
      tester.digest();
      expect(element.html()).to.equal('one');
    });
  });

  describe('routing', function() {
      it('should change the path', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .run(function ($rootScope) {
                  $rootScope.value = 'true';
              });

          tester = ngMidwayTester(appName, true);
          tester.visit('/');
          tester.waitForDigest(function () {
              expect(tester.path()).to.equal('/');
              done();
          })();
      });

      it('should update the when by the time the callback is called', function (done) {
          var example = angular.module(appName, ['ui.router'])
              .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
                  $urlRouterProvider.otherwise("/path");
                  $locationProvider.html5Mode(false).hashPrefix('!');

                  $stateProvider
                      .state('path', {
                          url: '/path',
                          views:{
                              '':{
                                  controller: function ($scope) {
                                      $scope.page = 'one';
                                  },
                                  template: '...'
                              }
                          }

                      })
                      .state('path2', {
                          url: '/path2',
                          views: {
                              '':{
                                  controller: function ($scope) {
                                      $scope.page = 'two';
                                  },
                                  template: '==='
                              }
                          }

                      })
              });


          tester = ngMidwayTester(appName, true);
          tester.attach();

          tester.visit('/path');
          var f1, f2;
          f1 = tester.waitForViewScopeCondition(function(){
              expect(tester.path()).to.equal('/path');
              expect(tester.rootElement().text()).to.equal('...');
              expect(tester.viewScope().page).to.equal('one');
              tester.visit('/path2');
              f2();
          },null,function(scope){
              return scope.page && scope.page==='one';
          });
          f2 = tester.waitForViewScopeCondition(function () {
                  expect(tester.path()).to.equal('/path2');
                  expect(tester.rootElement().text()).to.equal('===');
                  expect(tester.viewScope().page).to.equal('two');
                  done();
              }, null,function(scope){
              return scope.page && scope.page==='two';
          });
          f1();
      });
  });

  describe('controllers', function() {
    var example, newScope;

    beforeEach(function() {
      example = angular.module(appName, [])
        .factory('factory', function() {
          return function() {
            return 'hello';
          }
        })
        .controller('HomeCtrl', function($scope, factory) {
          $scope.factory = factory;
        });

      tester = ngMidwayTester(appName, true);
      newScope = tester.rootScope().$new();
    });

    it('should execute the controller without having to provide any locals other than the scope', function() {
      tester.controller('HomeCtrl', {
        $scope : newScope
      });
      expect(newScope.factory()).to.equal('hello');
    });

    it('should allow for mocking of other services too', function() {
      tester.controller('HomeCtrl', {
        $scope : newScope,
        factory : function() {
          return 'jello';
        }
      });
      expect(newScope.factory()).to.equal('jello');
    });
  });

  describe('$location', function() {

    it('should change the location properly on multiple instantiations', function() {
      var mod = angular.module(appName, []);

      var tester1 = ngMidwayTester(appName);
      tester1.inject('$location').path('/home');
      tester1.digest();
      expect(tester1.path()).to.equal('/home');
      tester1.destroy();

      var tester2 = ngMidwayTester(appName);
      tester2.inject('$location').path('/other');
      tester2.digest();
      expect(tester2.path()).to.equal('/other');
      tester2.destroy();

      var tester3 = ngMidwayTester(appName);
      tester3.inject('$location').path('/another');
      tester3.digest();
      expect(tester3.path()).to.equal('/another');
      tester3.destroy();
    });
  });

  describe ('System functions', function(){

    beforeEach(function() {
      example = angular.module(appName, [])
          .factory('factory', function() {
            return function() {
              return 'hello';
            }
          })
          .controller('HomeCtrl', function($scope, factory) {
            $scope.factory = factory;
          });

      tester = ngMidwayTester(appName, {
        template :  '<head><base href="/"></head>' +
        '<body>' +
        '<div>' +
        '  <h1>Help Desk</h1>' +
        '  <div id="view-container">' +
        '    <div ng-view =""></div>' +
        '  </div>' +
        '</div></body>'
      });
      newScope = tester.rootScope().$new();
    });


    it ('calling setTimeout should call a function after some time', function(done){
      var s = function(){
        expect(s).to.exist();
        clearTimeout(s);
        done();
      };
      setTimeout(s,1000);
    });
  })
});
