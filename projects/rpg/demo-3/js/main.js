(function(window, undefined) {
    var levelSettings = {
        screen: new rpg.util.Screen(64, 10, 7),

        areas: {
            dungeon: 'dungeon',
            arena: 'arena'
        },

        assets: {
            dungeon: {
                map: 'map.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json'
            },
            arena: {
                map: 'combatMap.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json'
            }
        },

        heroList: {
            corrina: rpg.entity.Corrina,
            seth: rpg.entity.Seth
        },

        heroFrames: {
            corrina: {
                walk_left_1: 'corrina_walk_left_1.png',
                walk_left_2: 'corrina_walk_left_2.png',
                face_left: 'corrina_face_left.png',
                walk_right_1: 'corrina_walk_right_1.png',
                walk_right_2: 'corrina_walk_right_2.png',
                face_right: 'corrina_face_right.png',
                walk_up_1: 'corrina_walk_up_1.png',
                walk_up_2: 'corrina_walk_up_2.png',
                face_up: 'corrina_face_up.png',
                walk_down_1: 'corrina_walk_down_1.png',
                walk_down_2: 'corrina_walk_down_2.png',
                face_down: 'corrina_face_down.png',
                attack_left_1: 'corrina_attack_left_1.png',
                attack_left_2: 'corrina_attack_left_2.png'
            },
            seth: {
                walk_left_1: 'seth_walk_left_1.png',
                walk_left_2: 'seth_walk_left_2.png',
                face_left: 'seth_face_left.png',
                walk_right_1: 'seth_walk_right_1.png',
                walk_right_2: 'seth_walk_right_2.png',
                face_right: 'seth_face_right.png',
                walk_up_1: 'seth_walk_up_1.png',
                walk_up_2: 'seth_walk_up_2.png',
                face_up: 'seth_face_up.png',
                walk_down_1: 'seth_walk_down_1.png',
                walk_down_2: 'seth_walk_down_2.png',
                face_down: 'seth_face_down.png',
                attack_left_1: 'seth_attack_left_1.png',
                attack_left_2: 'seth_attack_left_2.png'
            }
        },

        enemyList: [
            rpg.entity.EyeballScout,
            rpg.entity.EvilBear
        ],

        enemyFrames: [
            'eyeball.png',
            'bear.png'
        ],

        tileList: [
            'grass.png', // 0
            'water.png', // 1
            'cliff.png', // 2
            'cliff_b_grass.png', // 3
            'cliff_l_grass.png', // 4
            'cliff_bl_grass.png', // 5
            'cliff_rl_grass.png', // 6
            'cliff_r_grass.png', // 7
            'cliff_rb_grass.png', // 8
            'cliff_t_grass.png', // 9
            'cliff_tb_grass.png', // 10
            'cliff_tl_grass.png', // 11
            'cliff_tr_grass.png', // 12
            'cliff_trl_grass.png', // 13
            'cliff_tbl_grass.png', // 14
            'cliff_trb_grass.png', // 15
            'cliff_trbl_grass.png', // 16
            'cliff_rbl_grass.png', // 17
            'grass_l_water.png', // 18
            'grass_r_water.png', // 19
            'grass_t_water.png', // 20
            'grass_b_water.png', // 21
            'grass_tl_water.png', // 22
            'grass_tb_water.png', // 23
            'grass_rb_water.png', // 24
            'water_t_grass.png', // 25
            'cliff_bl_water.png', // 26
            'cliff_b_water.png', // 27
            'cliff_r_water.png', // 28
            'grass_tb_water.png' // 29
        ],

        playerData: {
            leader: 'corrina',
            party: ['seth'],
            coins: 500,
            inventory: {}
        },

        levelData: {
            dungeon: {
                start: {x: 0, y: 1},
                walkableTiles: [0, 18, 19, 20, 21, 22, 23, 24, 29],
                combatProbability: 0.1
            },
            arena: {
                start: {x: 8, y: 2},
                menuDiv: document.getElementById('menu-container'),
            }
        }
    };

    var gameEngine = new rpg.GameEngine(document.getElementById('canvas-container'), levelSettings);
    gameEngine.run();

}(window));