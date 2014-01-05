/** @jsx React.DOM */
(function(window, undefined) {

    var util = {};


    // Constants for key controls.
    var Control = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        ENTER: 13
    };
    util.Control = Control;


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

        var allAssetsLoaded = true;
        for (var key in assets) {
            var type = assets[key].substring(assets[key].lastIndexOf('.') + 1);
            if (this.data[assets[key]] === null && dataLoaders[type]) {
                allAssetsLoaded = false;
                dataLoaders[type](this.data, assets[key], function() {
                    self.onload(callback);
                });
            }
        }
        self.onload(callback);
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


    var Screen = function(tileSize, gridWidth, gridHeight) {
        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.width = tileSize * gridWidth;
        this.height = tileSize * gridHeight;

        this.gridMidWidth = Math.floor(this.gridWidth / 2);
        if (this.gridWidth % 2 == 0) {
            this.gridMidWidth -= 1;
        }
        this.gridRemWidth = this.gridWidth - this.gridMidWidth;

        this.gridMidHeight = Math.floor(this.gridHeight / 2);
        if (this.gridHeight % 2 == 0) {
            this.gridMidHeight -= 1;
        }
        this.gridRemHeight = this.gridHeight - this.gridMidHeight;
    };
    util.Screen = Screen;


    var CircularList = function(list) {
        this.index = 0;
        this.list = (list) ? list.slice(0) : [];
    };

    CircularList.prototype.asArray = function () {
        return this.list;
    }

    CircularList.prototype.get = function(index) {
        return this.list[index];
    };

    CircularList.prototype.add = function(value) {
        this.list.push(value);
        return this;
    };

    CircularList.prototype.remove = function(value) {
        var index = -1;
        for (var i = 0; i < this.list.length; i++) {
            if (value == this.list[i]) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            this.list.splice(index, 1);
        }

        if (this.index == this.list.length) {
            this.index -= 1;
        }
        return this;
    };

    CircularList.prototype.setCurrent = function(value) {
        for (var i = 0; i < this.list.length; i++) {
            if (value == this.list[i]) {
                this.index = i;
                break;
            }
        }
        return this;
    };

    CircularList.prototype.filter = function(callback) {
        var newList = [];
        for (var i = 0; i < this.list.length; i++) {
            if (callback(this.list[i])) {
                newList.push(this.list[i]);
            }
        }
        return new CircularList(newList);
    };

    CircularList.prototype.reset = function() {
        this.index = 0;
    };

    CircularList.prototype.count = function() {
        return this.list.length;
    };

    CircularList.prototype.isEmpty = function() {
        return (this.list.length == 0);
    };

    CircularList.prototype.next = function() {
        if (this.isEmpty()) {
            return null;
        }
        var value = this.list[this.index];
        this.index = (this.index + 1) % this.list.length;
        return value;
    };

    CircularList.prototype.prev = function() {
        if (this.isEmpty()) {
            return null;
        }
        var value = this.list[this.index];

        this.index = this.index - 1;
        this.index = (this.index < 0) ? this.list.length - 1 : this.index;
        return value;
    };

    CircularList.prototype.getRandom = function() {
        if (this.isEmpty()) {
            return null;
        }
        var index = Math.floor(Math.random() * this.list.length);
        return this.list[0];
    };

    CircularList.prototype.getCurrent = function() {
        if (this.isEmpty()) {
            return null;
        }
        return this.list[this.index];
    };

    CircularList.prototype.isLast = function() {
        return (this.index == this.list.length - 1);
    };

    util.CircularList = CircularList;


    EntityHashTable = function(table) {
        this.table = table || {};
    };

    EntityHashTable.prototype.addFromArrays = function(entityList, valueList) {
        for (var i = 0; i < entityList.length; i++) {
            this.add(entityList[i], valueList[i]);
        }
        return this;
    };

    EntityHashTable.prototype.add = function(entity, value) {
        this.table[entity.key] = value;
        return this;
    };

    EntityHashTable.prototype.get = function(entity) {
        return this.table[entity.key];
    };
    util.EntityHashTable = EntityHashTable;


    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.util = util;
})(window);