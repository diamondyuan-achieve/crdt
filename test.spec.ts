import { treeToString } from "./debug";
import { OrderTree } from "./tree";

it("", () => {
  const tree1 = new OrderTree("root");
  tree1.addLeaf([], "a");
  tree1.addLeaf([], "b");

  expect(treeToString(tree1.buildTree())).toEqual(
    `
root
├── b - 0000000002:root
└── a - 0000000001:root
`.trim()
  );
});

it("", () => {
  const tree1 = new OrderTree("root");
  const o1 = tree1.addLeaf([], "a");
  const tree2 = new OrderTree("root-b");
  const o2 = tree2.addLeaf([], "b");
  const o3 = tree2.addLeaf([], "b-1");

  tree1.applyEvent(o2);
  tree1.applyEvent(o3);
  tree2.applyEvent(o1);

  expect(treeToString(tree1.buildTree())).toEqual(
    `
root
├── b-1 - 0000000002:root-b
├── b - 0000000001:root-b
└── a - 0000000001:root
`.trim()
  );
});

it("", () => {
  const tree1 = new OrderTree("root");
  const o1 = tree1.addLeaf([], "a");
  const o2 = tree1.addLeaf([0], "b");
  const o3 = tree1.addLeaf([0], "c");
  const tree2 = new OrderTree("root-b");
  tree2.applyEvent(o1);
  tree2.applyEvent(o2);
  tree2.applyEvent(o3);

  tree1.applyEvent(tree2.addLeaf([0, 0], "a-a"));
  expect(treeToString(tree2.buildTree())).toEqual(
    `
root-b
├── a - 0000000001:root
│   └── a-a - 0000000001:root-b
├── c - 0000000003:root
└── b - 0000000002:root
`.trim()
  );
});
