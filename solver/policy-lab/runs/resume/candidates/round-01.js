'use strict';
// Offering untrimmed chains with occupancy price 0.001 may recover useful chains while charging their off-lattice occupancy cost.
module.exports = {
  "kind": "lab",
  "weights": {
    "occupancy": 0.001
  }
};
