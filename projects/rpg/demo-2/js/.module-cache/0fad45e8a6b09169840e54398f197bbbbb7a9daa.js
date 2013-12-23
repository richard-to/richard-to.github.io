/** @jsx React.DOM */
(function(window, undefined) {

    var util = {};


    // Functions to load data from specific file types into an object.
    var dataLoaders = {
        png: function(datastore, filename, onload) {
            var image = new Image();
            image.src = filename;
            image.onload = function() {
                datastore[filename] = image;
                onload();
            };
        },
        json: function(datastore, filename, onload) {
            $.getJSON(filename, function(data) {
                datastore[filename] = data;
                onload();
            });
        }
    };
    util.dataLoaders = dataLoaders;

    // Simple datastore/cache that loads images and JSON files synchronously.
    var Datastore = function(dataLoaders) {
        this.dataLoaders = dataLoaders || util.dataLoaders;
        this.data = {};
    }

    // Loads and caches assets.
    Datastore.prototype.load = function(assets, callback, dataLoaders) {
        var self = this;
        dataLoaders = dataLoaders || this.dataLoaders;
        for (var key in assets) {
            if (this.data[assets[key]] === undefined) {
                this.data[assets[key]] = null;
            }
        }

        for (var key in assets) {
            var type = assets[key].substring(assets[key].lastIndexOf('.') + 1);
            if (this.data[assets[key]] === null && dataLoaders[type]) {
                dataLoaders[type](this.data, assets[key], function() {
                    self.onload(callback);
                });
            }
        }
    };

    Datastore.prototype.onload = function(callback) {
        var data = {};
        for (key in this.data) {
            if (this.data[key] === null) {
                return false;
            } else {
                data[key] = this.data[key];
            }
        }
        if (callback) {
            callback();
        }
    };

    // Gets an assets in the data store.
    Datastore.prototype.get = function(key) {
        return this.data[key];
    };
    util.Datastore = Datastore;


    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.util = util;
})(window);