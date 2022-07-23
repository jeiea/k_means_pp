<a href="https://deno.land/x/denopack"><img src="https://img.shields.io/badge/Available%20on-deno.land/x-teal.svg?style=flat&logo=deno&labelColor=black" /></a>

# k_means_pp

Personal implementation of k-means algorithm.

## Usage

```typescript
import {
  getCartesianSquaredDistance,
  getVectorCentroid,
  kMeans,
  sfc32,
} from "https://deno.land/x/k_means_pp@0.1.0/mod.ts";

kMeans([
  [-10, 5, 100],
  [-11, 6, 101],
  [-10.5, 6.5, 102],
  [-9.5, 5.5, 103],
  [-9.75, 6.25, 104],

  [200, 12, -11],
  [205, 11.8, -10.8],
  [202, 11.5, -10],
  [208, 11, -12],
  [198, 11.15, -11],

  [40, -200, 568],
  [38, -190, 578],
  [39.5, -205, 556],
  [41, -200, 561],
  [41, -200, 561],
], {
  // The number of cluster. Required.
  k: 3,
  // Fields below are optional if you are using number array.
  getSquaredDistance: getCartesianSquaredDistance,
  getCentroid: getVectorCentroid,
  // Purely optional fields
  random: sfc32(0, 0, 0, 0),
  iteration: 5,
});
/*
[{
  centroid:  [ -10.15, 5.85, 102 ],
  cluster: [
    { index: 0, item: [-10, 5, 100] },
    { index: 1, item: [-11, 6, 101] },
    { index: 2, item: [-10.5, 6.5, 102] },
    { index: 3, item: [-9.5, 5.5, 103] },
    { index: 4, item: [-9.75, 6.25, 104] },
  ],
  sumOfSquaredError: 12.899999999999999,
}, {
  centroid: [ 39.9, -199, 564.8 ],
  cluster: [
    { index: 5, item: [200, 12, -11] },
    { index: 6, item: [205, 11.8, -10.8] },
    { index: 7, item: [202, 11.5, -10] },
    { index: 8, item: [208, 11, -12] },
    { index: 9, item: [198, 11.15, -11] },
  ],
  sumOfSquaredError: 65.94399999999999,
}, {
  centroid: [ 202.6, 11.489999999999998, -10.959999999999999 ],
  cluster: [
    { index: 10, item: [40, -200, 568] },
    { index: 11, item: [38, -190, 578] },
    { index: 12, item: [39.5, -205, 556] },
    { index: 13, item: [41, -200, 561] },
    { index: 14, item: [41, -200, 561] },
  ],
  sumOfSquaredError: 417,
}]
*/
```
