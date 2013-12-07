(function(window, undefined) {
    var Character = function(name, hp, damage) {
        this.name = name || 'No name';
        this.damage = damage || 2;
        this.hp = hp || 20;
    };

    Character.prototype.attack = function() {
        return this.damage;
    };

    Character.prototype.takeDamage = function(damage) {
        this.hp -= damage;
        if (this.hp < 0) {
            this.hp = 0;
        }
    };

    Character.prototype.isDead = function() {
        return this.hp == 0;
    };

    var Ogre = function() {
        Character.call(this, 'Ogre', 10, 2);
        this.exp = 2;
    };
    Ogre.prototype = Object.create(Character.prototype);
    Ogre.prototype.constructor = Ogre;

    var Hero = function() {
        Character.call(this, 'Hero', 50, 4);
        this.exp = 0;
        this.level = 1;
    };

    Hero.prototype = Object.create(Character.prototype);
    Hero.prototype.constructor = Hero;

    Hero.prototype.heal = function() {
        return 10;
    };

    Hero.prototype.fireball = function() {
        return 9;
    };
    var hero = new Hero();
    var ogre = new Ogre();
    var ogre2 = new Ogre();

    var currentAttackId;
    var initBattle = function(hero, enemies) {
        var combatDiv = document.getElementById('combat');
        while (combatDiv.lastChild) {
            combatDiv.removeChild(combatDiv.lastChild);
        }
        enemies.forEach(function(enemy) {
            var nameDiv = document.createElement('div');
            var nameText = document.createTextNode(enemy.name);
            nameDiv.appendChild(nameText);

            var hpDiv = document.createElement('div');
            var hpText = document.createTextNode(enemy.hp);
            hpDiv.appendChild(hpText);

            var wrapDiv  = document.createElement('div');
            wrapDiv.className = "enemy";
            wrapDiv.appendChild(nameDiv);
            wrapDiv.appendChild(hpDiv);
            combatDiv.appendChild(wrapDiv);
            wrapDiv.addEventListener('click', function() {
                if (currentAttackId == 0) {
                    enemy.takeDamage(hero.attack());
                } else if (currentAttackId == 1) {
                    enemy.hp += hero.heal();
                } else {
                    enemy.takeDamage(hero.fireball());
                }
                initBattle(hero, [ogre, ogre2]);
            })
        });

        var nameDiv = document.createElement('div');
        var nameText = document.createTextNode(hero.name);
        nameDiv.appendChild(nameText);

        var hpDiv = document.createElement('div');
        var hpText = document.createTextNode(hero.hp);
        hpDiv.appendChild(hpText);

        var wrapDiv  = document.createElement('div');
        wrapDiv.appendChild(nameDiv);
        wrapDiv.appendChild(hpDiv);
        wrapDiv.className = "hero";
        combatDiv.appendChild(wrapDiv);
    };
    initBattle(hero, [ogre, ogre2]);

    var attackBtn = document.getElementById('attack');
    attackBtn.addEventListener('change', function(e) {
        currentAttackId = e.target.selectedIndex;
    });
})(window);
