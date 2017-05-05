import React, { Component } from 'react';

export class Monster extends Component {
  constructor(location, level) {
    super();

    this.level = level;
    this.health = level * 20;
    this.damage = 8;
    this.location = location;

    this.handleAttack = this.handleAttack.bind(this);
    this.handleDefence = this.handleDefence.bind(this);
  }

  handleAttack() {
    const damage = this.damage;
    const attackDamage = Math.round(Math.random() * damage) + this.level;

    return attackDamage;
  }

  handleDefence(damage) {
    this.health = this.health - damage;
  }

  isAlive() {
    if (this.health > 0) {
      return true;
    }
    return false;
  }

  render() {
    if (this.health > 0) {
      return <td className="floor">M</td>;
    }
    return <td className="floor">.</td>;
  }
}

export function Boss() {
  return <td>B</td>;
}
