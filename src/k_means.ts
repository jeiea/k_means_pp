const getCumulativeDistributionIndex = (ratios: number[], value: number) => {
  let accumulation = 0;
  for (let i = 0; i < ratios.length; i++) {
    accumulation += ratios[i];
    if (accumulation >= value) {
      return i;
    }
  }
  return ratios.length - 1;
};

/** kMeans++ */
const pickCentroids = <T>(
  data: readonly T[],
  { k, getSquaredDistance, random, centroids: existings }: {
    k: number;
    getSquaredDistance: (a: T, b: T) => number;
    random: typeof Math.random;
    centroids?: T[];
  },
): T[] => {
  const centroids = existings ?? [data[Math.floor(random() * data.length)]];
  const squaredClosest = Array(data.length).fill(Infinity);

  const updateClosestDistance = (centroid: T) => {
    data.forEach((point, i) => {
      const distance = getSquaredDistance(centroid, point);
      const squared = distance ** 2;
      squaredClosest[i] = Math.min(squared, squaredClosest[i]);
    });
  };

  const addCentroidProportionally = () => {
    const sum = squaredClosest.reduce((acc, x) => acc + x);
    const pick = random() * sum;
    const index = getCumulativeDistributionIndex(squaredClosest, pick);

    centroids.push(data[index]);
  };

  for (let i = 0; i < centroids.length - 1; i++) {
    updateClosestDistance(centroids[i]);
  }

  for (let i = centroids.length - 1; i < k - 1; i++) {
    updateClosestDistance(centroids[i]);
    addCentroidProportionally();
  }

  return centroids;
};

const isNumberArray = (a: unknown): a is number[] => {
  return Array.isArray(a) && typeof a[0] === "number";
};

type Cluster<T> = { item: T; index: number }[];

const clustering = <T>(
  { centroids, points, getSquaredDistance }: {
    centroids: T[];
    points: { item: T; index: number }[];
    getSquaredDistance: (a: T, b: T) => number;
  },
) => {
  const clusters: Cluster<T>[] = centroids.map(() => []);
  const sumOfSquaredErrors = Array(centroids.length).fill(0);

  for (const point of points) {
    const distances = centroids.map((c, index) => ({
      distance: getSquaredDistance(c, point.item),
      index,
    }));
    const closest = distances.reduce((a, b) => b.distance < a.distance ? b : a);
    clusters[closest.index].push(point);
    sumOfSquaredErrors[closest.index] += closest.distance;
  }

  return { clusters, sumOfSquaredErrors };
};

const isClustersEqual = <T>(a: Cluster<T>[], b: Cluster<T>[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai.length !== bi.length) {
      return false;
    }

    for (let j = 0; j < ai.length; j++) {
      if (ai[j].index !== bi[j].index) {
        return false;
      }
    }
  }
  return true;
};

const removeOrphanCentroids = <T>(
  centroids: T[],
  clusters: Cluster<T>[],
): T[] => {
  const orphans: T[] = [];
  clusters.forEach((cluster, index) => {
    if (cluster.length === 0) {
      orphans.push(centroids[index]);
    }
  });
  return centroids.filter((x) => !orphans.includes(x));
};

type KMeansParameters<T> = {
  /** Number of clusters to create. Optimal value search is not implemented. */
  k: number;
  /** Function for calculating distance for values other than number array. */
  getSquaredDistance: (a: T, b: T) => number;
  /** Function for deriving centroid for values other than number array. */
  getCentroid: (data: T[]) => T;
  /** Random function. Default is constant PRNG sfc32. */
  random: typeof Math.random;
};

const genericKMeans = <T>(
  data: readonly T[],
  { k, getSquaredDistance, getCentroid, random }: KMeansParameters<T>,
) => {
  const points = data.map((item, index) => ({ item, index }));
  let centroids = pickCentroids(data, { k, random, getSquaredDistance });
  let { clusters, sumOfSquaredErrors } = clustering({
    centroids,
    points,
    getSquaredDistance,
  });

  while (true) {
    centroids = removeOrphanCentroids(centroids, clusters);
    centroids = pickCentroids(data, {
      k,
      random,
      getSquaredDistance,
      centroids,
    });

    const newCentroids = clusters.map((x) => getCentroid(x.map((y) => y.item)));
    const { clusters: newClusters, sumOfSquaredErrors: sses } = clustering({
      centroids: newCentroids,
      points,
      getSquaredDistance,
    });

    const isCentroidNotMoved = isClustersEqual(clusters, newClusters);
    centroids = newCentroids;
    clusters = newClusters;
    if (isCentroidNotMoved) {
      sumOfSquaredErrors = sses;
      break;
    }
  }

  return centroids.map((centroid, index) => ({
    centroid,
    cluster: clusters[index],
    sumOfSquaredError: sumOfSquaredErrors[index],
  }));
};

export const getCartesianSquaredDistance = (
  a: number[],
  b: number[],
): number => {
  let sum = 0;
  a.forEach((ai, i) => {
    const difference = ai - b[i];
    sum += difference ** 2;
  });
  return sum;
};

export const getVectorCentroid = (data: number[][]): number[] => {
  return data[0]
    .map((_, i) => data.reduce((acc, x) => acc + x[i], 0))
    .map((x) => x / data.length);
};

export const sfc32 = (a: number, b: number, c: number, d: number) => {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
};

/**
 * Clusters data using K-Means++ algorithm.
 */
export const kMeans = <T>(
  data: readonly T[],
  options?: Partial<KMeansParameters<T>> & {
    /** A number of trial for finding global optimum. */
    iteration?: number;
  },
): {
  /** Input data consisting cluster. */
  cluster: Cluster<T>;
  /** A value representing cluster center. */
  centroid: T;
  /** A value indicating how close to the optimum. */
  sumOfSquaredError: number;
}[] => {
  if (!data) {
    throw new Error("data is required");
  }
  if (data.length === 0) {
    return [];
  }

  const k = options?.k;
  if (!k) {
    throw new Error("Deriving k is not implemented");
  }
  if (k !== undefined && k < 1) {
    throw new Error("k must be positive");
  }
  if (isNumberArray(data[0])) {
    const length = data[0].length;
    if (!data.every((x) => (x as unknown as number[]).length === length)) {
      throw new Error("Every elements of array must be same length");
    }
  } else if (options?.getSquaredDistance === undefined) {
    throw new Error(
      "getSquaredDistance is required if data is not number arrays",
    );
  }
  const iteration = options?.iteration ??
    Math.max(1, Math.floor(Math.log2(data.length)));
  if (iteration < 1) {
    throw new Error("iteration must be positive");
  }

  const fixedOptions = {
    k: Math.min(k, data.length),
    getCentroid: (options?.getCentroid ?? getVectorCentroid) as NonNullable<
      typeof options.getCentroid
    >,
    getSquaredDistance: (options?.getSquaredDistance ??
      getCartesianSquaredDistance) as NonNullable<
        typeof options.getSquaredDistance
      >,
    random: options?.random ?? sfc32(0, 0, 0, 0),
  };

  let result = genericKMeans(data, fixedOptions);
  let minimalSse = result.reduce((acc, x) => acc + x.sumOfSquaredError, 0);
  for (let i = 1; i < iteration; i++) {
    const step = genericKMeans(data, fixedOptions);
    const sse = step.reduce((acc, x) => acc + x.sumOfSquaredError, 0);
    if (sse < minimalSse) {
      result = step;
      minimalSse = sse;
    }
  }
  return result;
};
