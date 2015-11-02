/**
 * Creates an instance of the midway tester on the specified module.
 *
 * @class ngMidwayTester
 * @constructor
 * @param moduleName the AngularJS module that you wish to test
 * @param {Object} [config]
 * @param {Object} [config.window=window] The window node of the page
 * @param {Object} [config.document=document] The document node of the page
 * @param {Object} [config.templateUrl] The template file for the HTML layout of the tester
 * @param {Object} [config.template] The template string for the HTML layout of the tester
 * @param {Object} [config.mockLocationPaths=true] Whether or not to fake the URL change in the browser address bar
 * @return {Object} An instance of the midway tester
 */


;
var ngMidwayTester = function (moduleName, options, deferred) {

    options = options || {};
    var doc = options.document || document;
    var wind = options.window || window;
    var noop = angular.noop;

    var mockLocationPaths = options.mockLocationPaths == null ? true : !!options.mockLocationPaths;


    var $rootElement = angular.element(doc.createElement('div')),
        $timers = [],
        $viewContainer,
        $terminalElement,
        $viewCounter = 0;

    var viewSelector = 'ui-view, [ui-view], .ui-view, [x-ui-view], [data-ui-view]';
    var $injector;


    var midwayModule = angular.module('ngMidway', [])
        .config(
        ['$injector', function ($i) {
            $injector = $i;
            if (deferred) deferred.resolve();
        }]
    );



    if (mockLocationPaths) {
        midwayModule.config(function ($provide) {
            $provide.decorator('$location', ['$delegate', '$rootScope', function ($delegate, $rootScope) {
                var _path = $delegate.path();
                $delegate.path = function (path) {
                    if (path) {
                        _path = path;
                        //console.log('$rootScope.$broadcast("$locationChangeSuccess", ', path,');');
                        $rootScope.$broadcast('$locationChangeStart', path);
                        $rootScope.$broadcast('$locationChangeSuccess', path);
                        return this;
                    }
                    else {
                        return _path;
                    }
                };
                return $delegate;
            }]);
        });
    }
    var notifyOnLocationChangeSuccess =[];


    if (options.templateUrl) {
        var request = new XMLHttpRequest();
        request.open('GET', options.templateUrl, false);
        request.send(null);

        if (request.status != 200) {
            throw new Error('ngMidwayTester: Unable to download template file');
        }

        options.template = request.responseText;
    }

    if (options.template) {
        $rootElement.html(options.template);
        var view = angular.element($rootElement[0].querySelector(viewSelector));
        $viewContainer = view.parent();
    }
    else {
        $viewContainer = angular.element('<div><div ui-view></div></div>');
        $rootElement.append($viewContainer);
    }

    $terminalElement = angular.element('<div status="{{__view_status}}"></div>');
    $rootElement.append($terminalElement);

    $injector = angular.bootstrap($rootElement, ['ng', 'ngMidway', moduleName]);
    var $rootModule = angular.module(moduleName);



    angular.element(doc.body).prepend($rootElement);



    return {


        /**
         * @method module
         * @return {Object} Returns the module container object acquired from angular.module(moduleName)
         */
        module: function () {
            return $rootModule;
        },

        /**
         * Attaches the $rootElement module to the provided body element
         * @param {Element} [body=document.body] The element that will be used as the parent (defaults to document.body)
         * @method attach
         */
        attach: function (body) {
            angular.element(body || doc.body).append($rootElement);
        },

        /**
         * Attaches the $rootElement module to the provided body element
         * @method controller
         * @param {String} name The name of the controller
         * @param {Object} [locals] A key/value map of all the injectable services for when the controller is instantiated
         * @return {Object} The instance of the controller
         */
        controller: function (name, locals) {
            return this.inject('$controller')(name, locals);
        },


        /**
         * @method rootScope
         * @return {Object} The $rootScope object of the module
         */
        rootScope: function () {
            return this.inject('$rootScope');
        },

        /**
         * @method rootElement
         * @return {Object} The $rootElement object of the module
         */
        rootElement: function () {
            return $rootElement;
        },

        /**
         * @method viewElement
         * @param {string|array} [viewName]  if array, the view is searched recursively
         * @return {Element} The current element that has ng-view attached to it
         */
        viewElement: function (viewName) {
            if (!viewName)     return angular.element($viewContainer[0].querySelector(viewSelector));
            if (typeof viewName === 'string') {
                return angular.element($viewContainer[0].querySelector('[ui-view="' + viewName + '"]'));
            }
            var curr = $viewContainer;
            for (var i = 0; i < viewName.length; i++) {
                //console.log('searching:', viewName[i]);
                if (!curr) return curr;
                curr = angular.element(curr[0].querySelector('[ui-view="' + viewName[i] + '"]'));
            }
            return curr;
        },

        /**
         * @method viewElement
         * @return {Object} The scope of the current view element
         */
        viewScope: function (viewName) {
            return this.viewElement(viewName).scope();
        },

        /**
         * Runs $scope.$evalAsync() on the provided scope
         * @param {function} fn The function to be provided to evalAsync
         * @param {Object} [scope=$rootScope] The scope object which will be used for the eval call
         * @method evalAsync
         */
        evalAsync: function (fn, scope) {
            (scope || this.rootScope()).$evalAsync(fn);
        },

        /**
         * Compiles and links the given HTML
         *
         * @method compile
         * @param {String|Element} html the html or element node which will be compiled
         * @param {Object} [scope=$rootScope] The scope object which will be linked to the compile
         * @return {Element} The element node which which is the result of the compilation
         */
        compile: function (html, scope) {
            return this.inject('$compile')(html)(scope || this.rootScope());
        },

        /**
         * Performs a digest operation on the given scope
         *
         * @method digest
         * @param {Object} [scope=$rootScope] The scope object which will be used for the compilation
         */
        digest: function (scope) {
            //(scope || this.rootScope()).$digest();
            var s = scope || this.rootScope();
            if (!s.$$phase) {
                s.$digest();
            }
            else {
                var $timeout = this.inject('$timeout');
                //console.log('skipped digest');
                $timeout(this.digest);
            }
        },

        /**
         * Performs an apply operation on the given scope
         *
         * @method apply
         * @param {function} fn The callback function which will be used in the apply digest
         * @param {Object} [scope=$rootScope] scope The scope object which the apply process will be run on
         */
        apply: function (fn, scope) {
            scope = scope || scope || this.inject('$rootScope');   //$rootScope
            scope.$$phase ? fn() : scope.$apply(fn);
        },

        /*
         * @method inject
         * @param {String} item The name of the service which will be fetched
         * @return {Object} The service fetched from the injection call
         */
        inject: function (item) {
            return $injector.get(item);
        },

        /**
         * @method injector
         * @return {Object} Returns the AngularJS $injector service
         */
        injector: function () {
            return $injector;
        },

        /**
         * @method path
         * @return {String} Returns the path of the current route
         */
        path: function () {
            return this.inject('$location').path();
        },

        state: function () {
            return this.inject('$state');
        },

        currentState: function () {
            return this.inject('$state').$current;
        },


        /**
         * Changes the current route of the page and then fires the callback when the page has loaded
         * @method visit
         * @param {String} path The given path that the current route will be changed to
         */
        visit: function (path) {
            var $location = this.inject('$location');
            this.apply(function () {

                $location.path(path);
            });

        },

        /**
         * @method timeOut
         * Calls a method after a angular timeout
         * @param fn
         */
        callFnOnTimeOut: function(fn, args){
            var $timeout = this.inject('$timeout');
            return function() {
                $timeout(function () {
                    fn.apply(null, args);
                })
            }
        },

        /**
         * Transforms a function into a function that will be called after a view will be available
         * @method waitForViewElement
         * @param {function} [fn] The given callback to fire once the view has been fully loaded
         * @param {bool} [noView] when false, does not wait for viewScope() to be available and ready
         * @returns {*}
         */
        waitForViewScopeCondition: function (fn, viewName, condition){
            var that = this;
            if (fn.$$$isViewDelayed) {
                return fn; //just to be sure a function is never double delayed
            }
            return function () {
                this.$$$isViewDelayed = true; //just to be sure a function is never double delayed
                var args = Array.prototype.slice.call(arguments);
                var myFun = that.callFnOnTimeOut(fn,args);
                that.until(function () {
                    //console.log(that.viewElement(viewName));
                    if (!that.viewElement(viewName))return false;
                    if (!that.viewElement(viewName).scope) return false;
                    var scope = that.viewElement(viewName).scope();
                    //console.log(scope);
                    return condition(scope);
                }, myFun || noop);
            }
        },

        waitForControllerInViewScope: function (fn, viewName, controllerName){
            return this.waitForViewScopeCondition(fn, viewName, function(scope){
                if (!scope) return false;
                if (!scope[controllerName])return false;
                return (scope[controllerName].constructor instanceof Function);
            })
        },


        /**
         * Transforms a function into a function that will be called after a view will be available
         * @method waitForViewElement
         * @param {function} [fn] The given callback to fire once the view has been fully loaded
         * @param {bool} [noView] when false, does not wait for viewScope() to be available and ready
         * @returns {*}
         */
        waitForViewCondition: function (fn, viewName, condition){
            var that = this;
            if (fn.$$$isViewDelayed) {
                return fn; //just to be sure a function is never double delayed
            }
            return function () {
                this.$$$isViewDelayed = true; //just to be sure a function is never double delayed
                var args = Array.prototype.slice.call(arguments);
                var myFun = that.callFnOnTimeOut(fn,args);
                that.until(function () {
                    var view=that.viewElement(viewName);
                    if (!view)return false;
                    //console.log(scope);
                    return condition(view);
                }, myFun || noop);
            }
        },


        /**
         * Transforms a function into a function that will be called after a complete digest will have happened
         * @method waitForDigest
         * @param {function} [fn] The given callback to fire once the view has been fully loaded
         * @param {bool} [noView] when false, does not wait for viewScope() to be available and ready
         * @returns {*}
         */
        waitForDigest: function (fn, noView) {
            var that = this;
            if (fn.$$$isDigestDelayed) {
                return fn; //just to be sure a function is never double delayed
            }
            if (noView === undefined) {
                noView = false;
            }

            return function () {
                this.$$$isDigestDelayed = true; //just to be sure a function is never double delayed
                var args = Array.prototype.slice.call(arguments);
                var myFun = that.callFnOnTimeOut(fn,args);
                that.rootScope().__view_status = ++$viewCounter;
                that.until(function () {
                    if (!noView) {
                        if (!that.viewScope()) {
                            return false;
                        }
                        if (that.viewScope().$$phase) {
                            return false;
                        }
                    }
                    return parseInt($terminalElement.attr('status')) >= $viewCounter;
                }, myFun || noop);
            }
        },
        /**
         * Keeps checking an expression until it returns a truthy value and then runs the provided callback
         *
         * @param {function} exp The given function to poll
         * @param {function} callback The given callback to fire once the exp function returns a truthy value
         * @method until
         */
        until: function (exp, callback) {

            var timer, delay = 0;
            timer = setInterval(function () {
                if (exp()) {
                    clearInterval(timer);
                    callback();
                }
                else {
                    active = true;
                }
            }, delay);
            $timers.push(timer);
        },


        /**
         * Removes the $rootElement and clears the module from the page
         *
         * @method destroy
         */
        destroy: function () {
            angular.forEach($timers, function (timer) {
                clearInterval(timer);
            });

            var body = angular.element(document.body);
            body.removeData();
            $rootElement.remove();
            this.rootScope().$destroy();
        }
    };
};
