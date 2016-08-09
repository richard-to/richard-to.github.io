# Changelog

* Add basic alpha-beta-pruning-based AI
* Select between 1 player and 2 player mode
* Start game by pressing a button
* Reset game in progress
* Fix tie games not being recognized
* Fix end game state triggering undefined errors in animation/event loop

# User Stories

1. Players can play a game of Connect 4. (Completed)
2. Players should know who's turn it is. (Completed)
3. Players should be notified if there is a winner or a tie. (Completed)
4. Winning Connect 4 pieces should be highlighted.
4. Players should be able to restart game. (Completed)
5. The game should keep track of wins and losses between players.
6. Players should be able to play against a computer player. (Completed)
7. Players should be able to change the difficulty of the computer player.
8. Players should be able to play the game on a mobile device.

# Known issues

* In 1 player mode, the animation for the human player stops one spot before reaching final spot

# Technical TODO

* Create an actual heuristic for alpha-beta-pruning algorithm
* Improve computational performance of AI
* Figure best approach to add tests to alpha-beta-pruning implementation
* Use web workers to prevent GUI freeze
* Maybe convert board to HTML/CSS instead of canvas to make game more responsive
* As usual, need to refactor code in a few places