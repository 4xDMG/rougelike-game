import React, { Component } from 'react';
import _ from 'lodash';
import BuildGameMap from './generateGameMap';
import Player from './player';
import { placePlayer, placeEntity, placeMonster, placeBoss } from './placeGameEntities';
import Potion from './items';
import { Monster, Boss } from './monsters';
import PlayerInfo from './playerInfo';

export default class GameMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mapDimensions: props.MapDimensions,
      currentLevel: 0,
      gameMap: [],
      player: {
        location: {
          x: 0,
          y: 0,
        },
        health: 100,
        level: 1,
        xp: 0,
        weapon: {
          type: 'empty',
          damage: 4,
        },
      },
      potionPos: [],
      monsters: [],
      boss: {},
      weapons: [
        {
          type: 'short sword',
          damage: 8,
          location: {
            x: 0,
            y: 0,
          },
        },
        {
          type: 'long sword',
          damage: 12,
          location: {
            x: 0,
            y: 0,
          },
        },
        {
          type: 'battle axe',
          damage: 15,
          location: {
            x: 0,
            y: 0,
          },
        },
      ],
    };

    this.handlePlayerMove = this.handlePlayerMove.bind(this);
    this.getTileType = this.getTileType.bind(this);
  }

  componentWillMount() {
    // Build a new Map.
    const mapDimensions = this.state.mapDimensions;
    const gameMapArr = BuildGameMap(mapDimensions);
    const currentLevel = this.state.currentLevel;
    this.setState({ currentLevel: currentLevel + 1 });

    this.setState({ gameMap: gameMapArr });

    // Initialize starting positions for entities.
    const player = this.state.player;
    player.location = placePlayer(gameMapArr, 0, 0, '.');
    this.setState({ player });

    const potionPos = [];
    for (let i = 0; i < 4; i += 1) {
      potionPos.push(placeEntity(gameMapArr, mapDimensions, '.'));
    }

    this.setState({ potionPos });

    const monsters = [];
    for (let i = 0; i < 5; i += 1) {
      const location = placeMonster(gameMapArr, mapDimensions, '.');
      const monster = new Monster(location);
      monsters.push(monster);
    }

    this.setState({ monsters });

    const weapons = this.state.weapons;
    weapons[currentLevel].location = placeEntity(gameMapArr, mapDimensions, '.');
    this.setState({ weapons }); 

    const bossLoc = placeBoss(gameMapArr, mapDimensions, '.');
    const boss = new Monster(bossLoc, currentLevel + 2);
    this.setState({ boss });
  }

  handlePlayerMove(event) {
    event.preventDefault();

    const player = this.state.player;
    const playerX = this.state.player.location.x;
    const playerY = this.state.player.location.y;
    // Check tile that player wants to move to and move Player
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        if (this.handleEntityCollision({ x: playerX - 1, y: playerY })) {
          break;
        }
        if (this.checkPlayerMove('x', 'up')) {
          player.location.x = playerX - 1;
          player.location.y = playerY;
          this.setState({ player });
        }
        break;
      case 's':
      case 'ArrowDown':
        if (this.handleEntityCollision({ x: playerX + 1, y: playerY })) {
          break;
        }
        if (this.checkPlayerMove('x', 'down')) {
          player.location.x = playerX + 1;
          player.location.y = playerY;
          this.setState({ player });
        }
        break;
      case 'a':
      case 'ArrowLeft':
        if (this.handleEntityCollision({ x: playerX, y: playerY - 1 })) {
          break;
        }
        if (this.checkPlayerMove('y', 'left')) {
          player.location.x = playerX;
          player.location.y = playerY - 1;
          this.setState({ player });
        }
        break;
      case 'd':
      case 'ArrowRight':
        if (this.handleEntityCollision({ x: playerX, y: playerY + 1 })) {
          break;
        }
        if (this.checkPlayerMove('y', 'right')) {
          player.location.x = playerX;
          player.location.y = playerY + 1;
          this.setState({ player });
        }
        break;
      default:
        break;
    }
  }

  handleEntityCollision(newPlayerPos) {
    const monsters = this.state.monsters;
    const potions = this.state.potionPos;

    // Check if tile contains a monster.
    let monsterIndex = NaN;
    const isMonster = monsters.some((currentMonster, index) => {
      if (_.isEqual(currentMonster.location, newPlayerPos)) {
        monsterIndex = index;
        return true;
      }
      return false;
    });

    // If tile contains a monster handle combat.
    if (isMonster && monsters[monsterIndex].isAlive()) {
      const player = this.state.player;
      const playerDamage = Player.handleAttack(player.weapon.damage, player.level);
      const monsterDamage = monsters[monsterIndex].handleAttack();

      monsters[monsterIndex].handleDefence(playerDamage);
      player.health -= monsterDamage;
      // Check if Player survived combat.
      if (!Player.isAlive(player.health)) {
        alert('you lose!');
      }
      // If Player defeated Monster give Player xp.
      if (!monsters[monsterIndex].isAlive()) {
        const newXp = Player.handleXp(player.xp, player.level, 200);
        if (newXp.Lvl) {
          player.level = newXp.Lvl;
        }
        player.xp = newXp.xp;
      }

      this.setState({ player });
      return true;
    }

    let potionIndex = NaN;
    const isPotion = potions.some((currentPotion, index) => {
      if (_.isEqual(currentPotion, newPlayerPos)) {
        potionIndex = index;
        return true;
      }
      return false;
    });

    if (isPotion) {
      const player = this.state.player;
      const potionPos = this.state.potionPos;
      potionPos.splice(potionIndex, 1);
      if ((player.health + 20) >= 100) {
        player.health = 100;
        this.setState({ player });
      } else {
        player.health += 20;
        this.setState({ player });
      }
      this.setState({ potionPos });
    }

    const weapon = this.state.weapons[this.state.currentLevel - 1];
    if (_.isEqual(newPlayerPos, weapon.location)) {
      const player = this.state.player;
      player.weapon = weapon;
      this.setState({ player });
    }

    const boss = this.state.boss;
    if (_.isEqual(newPlayerPos, boss.location)) {
      const player = this.state.player;
      const playerDamage = Player.handleAttack(player.weapon.damage, player.level);
      const bossDamage = boss.handleAttack();

      boss.handleDefence(playerDamage);
      player.health -= bossDamage;
      // Check if Player survived combat.
      if (!Player.isAlive(player.health)) {
        alert('you lose!');
      }
      // If Player defeated Monster give Player xp.
      if (!boss.isAlive()) {
        const newXp = Player.handleXp(player.xp, player.level, 200);
        if (newXp.Lvl) {
          player.level = newXp.Lvl;
        }
        player.xp = newXp.xp;
        boss.location = 0;
      }

      this.setState({ boss });
      this.setState({ player });
      return true;
    }

    return false;
  }

  // Check if tile to move to is a wall.
  checkPlayerMove(axis, direction) {
    const gameMap = this.state.gameMap;
    const playerX = this.state.player.location.x;
    const playerY = this.state.player.location.y;

    if (axis === 'x') {
      if (direction === 'up') {
        if (gameMap[playerX - 1][playerY] === '.') return true;
        return false;
      }
      if (gameMap[playerX + 1][playerY] === '.') return true;
      return false;
    }
    if (direction === 'left') {
      if (gameMap[playerX][playerY - 1] === '.') return true;
      return false;
    }
    if (gameMap[playerX][playerY + 1] === '.') return true;
    return false;
  }

  // Gets a portion of the map to display.
  getViewBoundary(player, mapDimensions, viewSize) {
    const mapBoundaries = {};
    mapBoundaries.top = player.x - viewSize;
    mapBoundaries.left = player.y - viewSize;
    mapBoundaries.bottom = player.x + viewSize;
    mapBoundaries.right = player.y + viewSize;

    if (mapBoundaries.top < 0) {
      const excessBoundaryTop = Math.abs(mapBoundaries.top);
      mapBoundaries.top = 0;
      mapBoundaries.bottom += excessBoundaryTop;
    }

    if (mapBoundaries.left < 0) {
      const excessBoundaryLeft = Math.abs(mapBoundaries.left);
      mapBoundaries.left = 0;
      mapBoundaries.right += excessBoundaryLeft;
    }

    if (mapBoundaries.bottom >= mapDimensions.x) {
      const excessBoundaryBottom = mapBoundaries.bottom - mapDimensions.x;
      mapBoundaries.bottom = mapDimensions.x - 1;
      mapBoundaries.top -= excessBoundaryBottom;
    }

    if (mapBoundaries.right >= mapDimensions.y) {
      const excessBoundaryRight = mapBoundaries.right - mapDimensions.y;
      mapBoundaries.right = mapDimensions.right - 1;
      mapBoundaries.left -= excessBoundaryRight;
    }
    return mapBoundaries;
  }


  getTileType(rowIndex, tileIndex, tile, gameMap) {
    const playerPos = this.state.player.location;
    const potionPos = this.state.potionPos;
    const monsters = this.state.monsters;
    const boss = this.state.boss;
    const weapon = this.state.weapons[this.state.currentLevel - 1];
    const currentPos = { x: rowIndex, y: tileIndex };
    let monsterIndex = 0;

    if (_.isEqual(playerPos, currentPos)) {
      return <td>@</td>;
    } else if (_.find(potionPos, currentPos)) {
      return <Potion key={`Potion${tileIndex}`} />;
    } else if (_.isEqual(boss.location, currentPos)) {
      return <Boss key="boss" />;
    } else if (monsters.some((currentMonster, index) => {
      monsterIndex = index;
      return _.isEqual(currentMonster.location, currentPos);
    })) {
      return monsters[monsterIndex].render();
    } else if (_.isEqual(weapon.location, currentPos)) {
      return 'W';
    } else if (tile === '#') {
      const wallClassesArr = [];
      if (gameMap[rowIndex + 1][tileIndex] === '.') {
        wallClassesArr.push('wall-top');
      } else if (gameMap[rowIndex + 2][tileIndex] === '.') {
        wallClassesArr.push('wall-top-border');
      }
      if (gameMap[rowIndex][tileIndex + 1] === '.') {
        wallClassesArr.push('wall-left');
      }
      if (Array.isArray(gameMap[rowIndex - 1])) {
        if (gameMap[rowIndex - 1][tileIndex] === '.') {
          wallClassesArr.push('wall-bottom');
        }
      }
      if (tileIndex - 1 >= 0) {
        if (gameMap[rowIndex][tileIndex - 1] === '.') {
          wallClassesArr.push('wall-right');
        }
        if (Array.isArray(gameMap[rowIndex - 1])) {
          if (gameMap[rowIndex - 1][tileIndex - 1] === '.') {
            wallClassesArr.push('corner-bottom-right');
          }
        }
      }
      const wallClasses = wallClassesArr.join(' ');
      return <td className={wallClasses} key={`tile${tileIndex}`}>{tile}</td>;
    }

    return <td className="floor" key={`tile${tileIndex}`} />;
  }

  render() {
    const playerPos = this.state.player.location;
    const viewBoundary = this.getViewBoundary(playerPos, this.state.mapDimensions, 7);

    return (
      <div>
        <table tabIndex="1" onKeyDown={this.handlePlayerMove}>
          <tbody>
            {this.state.gameMap.map((rowArr, rowIndex, gameMap) => {
              if (rowIndex >= viewBoundary.top && rowIndex <= viewBoundary.bottom) {
                return (
                  <tr key={`row${rowIndex}`}>
                    {rowArr.map((tile, tileIndex) => {
                      if (tileIndex >= viewBoundary.left && tileIndex <= viewBoundary.right){
                        return this.getTileType(rowIndex, tileIndex, tile, gameMap);
                      }
                    })
                    }
                  </tr>
                );
              }
            })
            }
          </tbody>
        </table>
        <PlayerInfo
          Health={this.state.player.health}
          Level={this.state.player.level}
          Weapon={this.state.player.weapon.type}
        />
      </div>
    );
  }
}

GameMap.propTypes = {
  MapDimensions: React.PropTypes.shape({
    height: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
  }).isRequired,
};
