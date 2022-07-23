import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.148.0/testing/asserts.ts";
import { kMeans, sfc32 } from "./k_means.ts";

Deno.test("kMeans", async (test) => {
  await test.step("when given empty", async (test) => {
    const result = kMeans([], { k: 2 });

    await test.step("it should return empty", () => {
      assertEquals(result.length, 0);
    });
  });

  await test.step("when given one element", async (test) => {
    const data = [[1, 2, 3]];
    const result = kMeans(data, { k: 1 });

    await test.step("it should return one group", () => {
      assertEquals(result.length, 1);
    });

    await test.step("it should return original data as centroid", () => {
      assertEquals(result[0].centroid, data[0]);
    });

    await test.step("it should return data intact", () => {
      assertEquals(result[0].cluster, [{ item: data[0], index: 0 }]);
    });
  });

  await test.step("when given many elements", async (test) => {
    const sameObject = [41, -200, 561];
    const data3D = [
      [
        [-10, 5, 100],
        [-11, 6, 101],
        [-10.5, 6.5, 102],
        [-9.5, 5.5, 103],
        [-9.75, 6.25, 104],
      ],
      [
        [200, 12, -11],
        [205, 11.8, -10.8],
        [202, 11.5, -10],
        [208, 11, -12],
        [198, 11.15, -11],
      ],
      [
        [40, -200, 568],
        [38, -190, 578],
        [39.5, -205, 556],
        sameObject,
        sameObject,
      ],
    ];

    const result = kMeans(data3D.flat(), { k: 3 });

    await test.step("it should return three groups", () => {
      assertEquals(result.length, 3);
    });

    await test.step("it should return expected result", () => {
      const getCentroid = (data: number[][]): number[] => {
        return data[0]
          .map((_, i) => data.reduce((acc, x) => acc + x[i], 0))
          .map((x) => x / data.length);
      };

      const sortedResult = result.sort((a, b) =>
        a.cluster[0].index - b.cluster[0].index
      );
      assertEquals(sortedResult, [
        {
          centroid: getCentroid(data3D[0]),
          cluster: [
            { index: 0, item: [-10, 5, 100] },
            { index: 1, item: [-11, 6, 101] },
            { index: 2, item: [-10.5, 6.5, 102] },
            { index: 3, item: [-9.5, 5.5, 103] },
            { index: 4, item: [-9.75, 6.25, 104] },
          ],
          sumOfSquaredError: 12.899999999999999,
        },
        {
          centroid: getCentroid(data3D[1]),
          cluster: [
            { index: 5, item: [200, 12, -11] },
            { index: 6, item: [205, 11.8, -10.8] },
            { index: 7, item: [202, 11.5, -10] },
            { index: 8, item: [208, 11, -12] },
            { index: 9, item: [198, 11.15, -11] },
          ],
          sumOfSquaredError: 65.94399999999999,
        },
        {
          centroid: getCentroid(data3D[2]),
          cluster: [
            { index: 10, item: [40, -200, 568] },
            { index: 11, item: [38, -190, 578] },
            { index: 12, item: [39.5, -205, 556] },
            { index: 13, item: sameObject },
            { index: 14, item: sameObject },
          ],
          sumOfSquaredError: 417,
        },
      ]);
    });
  });

  await test.step("when given arbitrary elements", async (test) => {
    const random = sfc32(1, 10, 100, 1000);
    const randomInt = (limit: number) => {
      return Math.floor(random() * limit);
    };

    await test.step("it should return valid result", () => {
      for (let dimension = 1; dimension < 5; dimension++) {
        for (let trial = 0; trial < 100; trial++) {
          const points = [];
          const size = randomInt(100) + 1;
          for (let j = 0; j < size; j++) {
            points.push([...Array(dimension).keys()].map(random));
          }

          const k = randomInt(size - 1) + 1;
          const result = kMeans(points, { k });

          assertEquals(result.length, k);
          assert(result.every((x) => x.cluster.length > 0));
        }
      }
    });
  });
});
