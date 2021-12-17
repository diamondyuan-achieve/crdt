import { treeToString } from "./debug";
import { OrderTree } from "./tree";

it("1", () => {
  const tree1 = new OrderTree("root");
  tree1.addLeaf([], null, "a");
  tree1.addLeaf([], null, "b");

  expect(treeToString(tree1.buildTree())).toEqual(
    `
root
├── b - 0000000002:root
└── a - 0000000001:root
`.trim()
  );
});
