import { OrderTree } from "./tree";

function compareTree(a: OrderTree, b: OrderTree) {
  const aLogs = a.logs.map((p) => p.id.toString());
  const bLogs = a.logs.map((p) => p.id.toString());

  const equal = aLogs.toString() === bLogs.toString();
  return equal;
}

function random(count: number) {
  return Math.floor(Math.random() * count);
}

function createRandomTree(id: string, opCount: number) {
  const tree = new OrderTree(id);
  const indexList = [];
  const logs = [];
  for (let i = 0; i < opCount; i++) {
    if (i === 0) {
      logs.push(tree.addLeaf([], null, `${id}-${i}`));
    } else {
      const randomIndex = random(i);
      indexList.push(randomIndex);
      logs.push(tree.addLeaf([0], randomIndex, `${id}-${i}`));
    }
  }
  return { tree, logs };
}

it("1", () => {
  for (let i = 0; i < 1000; i++) {
    const tree1 = createRandomTree("root", 10);
    const tree2 = createRandomTree("root-2", 10);
    const equal = compareTree(tree1.tree, tree2.tree);
    if (!equal) {
      throw new Error("");
    }
  }
});
