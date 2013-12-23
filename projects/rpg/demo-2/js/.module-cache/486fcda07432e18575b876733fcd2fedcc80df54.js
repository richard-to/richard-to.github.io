/** @jsx React.DOM */
(function(window, undefined) {

    var util = {};

    // Functions to load data from specific file types into an object
    var dataLoaders = {
        png: function(datastore, key, filename, onload) {
            var image = new Image();
            image.src = filename;
            image.onload = function() {
                datastore[key] = image;
                onload();
            };
        },
        json: function(datastore, key, filename, onload) {
            $.getJSON(filename, function(data) {
                datastore[key] = data;
                onload();
            });
        }
    };
    util.dataLoaders = dataLoaders;

    var Datastore = function(dataLoaders) {
        this.dataLoaders = dataLoaders || util.dataLoaders;
        this.data = {};
    }

    Datastore.prototype.load = function(assets, onload, dataLoaders) {
        dataLoaders = dataLoaders || this.dataLoaders;
        for (var key in assets) {
            var type = assets[key].substring(assets[key].lastIndexOf('.') + 1);
            if (this.data[assets[key]] === undefined && dataLoaders[type]) {
                dataLoaders[type](this.data, key, assets[key], this.onload);
            }
        }
    };

    Datastore.prototype.onload = function(callback) {
        for (key in datastore) {
            if (datastore[key] == null) {
                return false;
            }
        }
        onload();
    };

    Datastore.prototype.get = function(key) {
        return this.data[key];
    };

    util.Datastore = Datastore;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.util = util;
})(window);