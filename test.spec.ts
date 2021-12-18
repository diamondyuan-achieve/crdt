import { treeToString } from "./debug";
import { OrderTree } from "./tree";

function compareTree(a: OrderTree, b: OrderTree) {
  const aLogs = a.logs.map((p) => p.id.toString());
  const bLogs = b.logs.map((p) => p.id.toString());

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
    const { tree: tree1, logs: logs1 } = createRandomTree("root", 10);
    const { tree: tree2, logs: logs2 } = createRandomTree("root-2", 10);
    tree1.applyEvents(logs2);
    tree2.applyEvents(logs1);
    const equal = compareTree(tree2, tree1);
    if (!equal) {
      throw new Error("");
    }
  }
});

it("move", () => {
  const { tree } = createRandomTree("root", 3);

  const tree2 = tree.clone("root-b");
  const op1 = tree2.move([], 0, [1], null);
  const op2 = tree.move([], 1, [0], null);

  tree.applyEvent(op1);
  tree2.applyEvent(op2);
  expect(compareTree(tree, tree2)).toBeTruthy();
});
