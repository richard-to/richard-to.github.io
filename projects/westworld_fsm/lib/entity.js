(function(window, undefined) {

    // All entities have an id and need to implement update method
    // Entities should have unique ids, which is important for
    // passing messages
    var BaseEntity = function(id) {
        this.id = 0;
        this.setId(id);
    };

    BaseEntity.prototype.setId = function(id) {
        this.id = id;
    };

    BaseEntity.prototype.getId = function() {
        return this.id;
    };

    BaseEntity.prototype.update = function() {
        return 0;
    };


    var EntityManager = function() {
        this.table = {};
    };

    EntityManager.prototype.register = function(entity) {
        this.table[entity.getId()] = entity;
    }

    EntityManager.prototype.getById = function(id) {
        return this.table[id];
    };

    EntityManager.prototype.removeEntity = function(entity) {
        if (table[entity.getId()]) {
            delete table[entity.getId()];
        }
    };

    window.entity = {
        EntityManager: EntityManager,
        BaseEntity: BaseEntity
    };
}(window));