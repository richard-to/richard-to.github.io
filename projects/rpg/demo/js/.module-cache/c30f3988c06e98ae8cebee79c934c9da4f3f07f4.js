/** @jsx React.DOM */
var HeroStats = React.createClass({displayName: 'HeroStats',
    render: function() {
        var createItem = function(hero) {
            return (
                React.DOM.tr(null, 
                    React.DOM.td( {className:"name"}, hero.name),
                    React.DOM.td( {className:"hp"}, hero.hp,"/",hero.hp),
                    React.DOM.td( {className:"mp"}, hero.mp,"/",hero.mp)
                )
            )
        };
        return (
            React.DOM.table( {className:"hero-status"}, 
                React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                this.props.items.map(createItem)
            )
        );
    }
});

var HeroStatsApp = React.createClass({displayName: 'HeroStatsApp',
    getInitialState: function() {
        return {
            items: [
                {name: "Character 1", hp: 100, mp: 50},
                {name: "Character 2", hp: 200, mp: 30},
                {name: "Character 3", hp: 990, mp: 15}
            ]
        };
    },
    render: function() {
        return (
            HeroStats( {items:this.state.items} )
        );
    }
});

React.renderComponent(
    HeroStatsApp(null ),
    document.getElementById('menu-wrap')
);