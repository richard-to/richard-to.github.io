---
layout: post
title: "Math RPG - Part 4"
---

Just finished finals. I should be happy about this, but two days in and I don't know what to do with myself. Mostly I feel tired and sleepy. I think because of all the late nights and Americano's that I chugged down this week. The point of this aside though, is that I didn't work on my RPG for two weeks and I'm not happy about that. It's frustrating.

The strategy that works best for me is to do something everyday. Once I get a few days in, getting started is much easier. The problem is always starting though. That first day. I'll find anything to avoid even looking at my projects. Even now, I'm writing this post to avoid programming.

One major problem is that I left off in a bad spot. I ran into an issue with my combat system impementation. In my simplified use-case, I had my character fighting two orcs. After my character attacks, the two orcs attack back. Since the game-play is turned based, it would be simple to code synchronously. Unfortunately the animations run asnychronously. This essentially means callback hell. The following snippet occurs after the player selects attack from the menu.

{% highlight javascript linenos=table %}
handleEnemySelect: function(entity, event) {
    var self = this;

    entity.takeDamage(this.props.party[0].attack());

    this.props.gameState.partyTurn = null;
    this.props.gameState.selectedEnemy = null;
    this.props.heroSprite.attackLeft(function() {
        self.props.gameState.partyTurn = self.props.party[0];
        self.props.sprites[0].attackRight(function() {
            self.props.party[0].takeDamage(self.props.enemies[0].attack());
            self.props.sprites[1].attackRight(function() {
                self.props.party[0].takeDamage(self.props.enemies[1].attack());
                self.setState({showActions: 1});
            });
        });
    });
    this.setState({showActions: 0});
},
{% endhighlight %}

That code will only get worse once I add in logic that takes into account characters dying when they hit 0 HP, spellcasting, multiple party members, etc.

Before I got distracted by finals, I was thinking about possible solutions. My initial solutions was to play each turn logically and then run the corresponding animations. This could reduce the mix of logic and graphics code. An immediate problem is that the menus use React instead of canvas, which means the menus don't get updated in the game loop. Additionally if I played each turn logically first, I would need to make sure the HP bars showed the right numbers after each attack. This would mean keeping copies of the character stats after each move - ie, if the orc attacked the hero with 20 HP and did 5 damage, the hero's HP should display 15. If all of that soundes convoluted, I will be the first to agree.

To avoid the nested callbacks, I considered using an animation queue that works kind of like the async library. Here is an example of how I envisioned it could work.

{% highlight javascript linenos=table %}
Animation.queue(Hero.attack).queue(Enemy.attack).queue(Enemy.attack).run(function() {
    // Logic Here.
});
{% endhighlight %}

That looks fairly clean, but unfortunately my use cases are more complicated. Here is another variation I played around with.

{% highlight javascript linenos=table %}
forEach(DataHeroes)
    if (DataEnemies.Alive()) {
        Animation.queue(Hero.attack,  DataHero.attack(DataEnemy));
    } else {
        break;
    }
}

forEach(DataEnemies)
    if (DataHeroes.Alive()) {
        Animation.queue(DataEnemy.attack,  DataEnemy.attack(DataHero));
     }
}

Animation.run(function() {
    if (DataEnemies.Alive()) {
        ContinueBattle();
    } else {
        RunEndSequence();
    }
});
{% endhighlight %}

This snippet is better. It accounts for dead enemies and heroes and all animations get queued sequentially before being run. The Animation class will fire the callback passed into the run method after all animations are run. Once again this doesn't update the menu, and it does not work well for multiple party members.

With that said, I found some time to put up quick a demo where you can move the character around the map. You can [view the demo here](/projects/rpg/demo-1/).