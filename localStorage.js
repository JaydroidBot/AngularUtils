(function (angular) {
    "use strict";

    /**
     * @ngdoc overview
     * @name datalayer.localstorage
     *
     * @description
     * Implements data persistence using the client browser's localStorage or
     * sessionStorage.
     * This supports simple key-value storage
     */
    angular.module("datalayer.localstorage", [])

    /**
     * @ngdoc service
     * @name datalayer.localstorage:silLocalStorageBackendProvider
     * @module datalayer.localstorage
     *
     * @description
     * Configures silLocalStorageBackend settings
     */
    .provider("silLocalStorageBackend", LocalStorageBackendProvider);

    function LocalStorageBackendProvider() {
        var valid_backends = ["localStorage", "sessionStorage"];
        var backend = valid_backends[0];

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackendProvider
         * @name setBackend
         *
         * @param {String} backendname Name of the backend to use. Valid values
         * are `localStorage` or `sessionStorage`
         *
         * @returns {Object} The instance of the provider
         *
         * @throws {Error} If the backendname is not valid.
         *
         * @description
         * Sets the backend to use
         *
         */
        this.setBackend = function (backendname) {
            if (valid_backends.indexOf(backendname) === -1) {
                throw new Error(
                    "'" + backendname + "'" +
                    " is an invalid local storage backend." +
                    " Valid backends are: " + valid_backends.join(", ")
                );
            }
            backend = backendname;
            return this;
        };

        this.$get = ["$window", "$q", function ($window, $q) {
            return new LocalStorageBackend($window[backend], $q);
        }];
    }
    /**
     * @ngdoc service
     * @name datalayer.localstorage:silLocalStorageBackend
     * @module datalayer.localstorage
     * @requires $q
     *
     * @description
     * Gives access to localStorage or sessionStorage
     */
    function LocalStorageBackend(lStorage, $q) {

        /**
         * Wraps result in the envelope expected by clients
         */
        function wrapResult (result) {
            return {
                "data": result
            };
        }

        /**
         * Convert a string to JSON and return it, else return the original
         * string
         */
        function toJSON(i) {
            try {
                return JSON.parse(i);
            } catch (e) {
            }
            return i;
        }

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name create
         *
         * @param {Object} val Record object to create
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Creates a new record in the store.
         * Just because [safari is a douche and storage can get filled up]
         * (https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem#Exceptions),
         * this promise can be rejected
         */
        LocalStorageBackend.prototype.create = function (data, options) {
            function resolver(resolve, reject) {
                // TODO reject undefined values
                var key = angular.isObject(options) ? options.key : data.id;
                if (!key) {
                    reject(wrapResult({"error":"provide key or id"}));
                }
                try {
                    lStorage.setItem(key, JSON.stringify(data));
                    resolve(wrapResult(data));
                } catch (e) {
                    reject(wrapResult(e));
                }
            }
            return $q(resolver);
        };

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name get
         *
         * @param {String} key Unique identifier of the record
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Retrieves a record by its uid
         *
         */
        LocalStorageBackend.prototype.get = function (key) {
            function resolver(resolve) {
                var result = lStorage.getItem(key);
                resolve(wrapResult(toJSON(result)));
            }
            return $q(resolver);
        };

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name list
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Retrieves a list of records from the store
         *
         */
        LocalStorageBackend.prototype.list = function () {
            function resolver(resolve) {
                var len = lStorage.length;
                var data = [];
                for (var i = 0; i < len; i++) {
                    data.push(
                        toJSON(lStorage.getItem(lStorage.key(i)))
                    );
                }
                resolve(wrapResult({results: data}));
            }
            return $q(resolver);
        };

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name update
         *
         * @param {String} key Unique identifier of the record
         * @param {Object} val Record object to update
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Updates or creates a new record in the store. Just like the
         * {@link datalayer.localstorage.silLocalStorageBackend#create create}
         * method, this method can reject promises.
         *
         */
        LocalStorageBackend.prototype.update = function (key, val) {
            var data = angular.copy(val);
            val.id = key;
            return this.create(data);
        };

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name remove
         *
         * @param {String} key Unique identifier of the record
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Removes a record from the store, identified by its key
         *
         */
        LocalStorageBackend.prototype.remove = function (key) {
            function resolver (resolve) {
                lStorage.removeItem(key);
                resolve(wrapResult(undefined));
            }
            return $q(resolver);
        };

        /**
         * @ngdoc method
         * @methodOf datalayer.localstorage:silLocalStorageBackend
         * @name removeAll
         *
         * @returns {Promise} A promise that will resolve succesfully if the
         * method succeeds
         *
         * @description
         * Removes all records from the store
         *
         */
        LocalStorageBackend.prototype.removeAll = function () {
            function resolver (resolve) {
                lStorage.clear();
                resolve(wrapResult(undefined));
            }
            return $q(resolver);
        };
    }
})(window.angular);
