import { Clock, Ordering } from "./clock";

enum Action {
  AddLeaf,
}

interface AddLeaf {
  type: Action.AddLeaf;
  parentId: Clock | null;
  leftId: Clock | null;
  id: Clock;
  value: string;
}

type Event = AddLeaf;

class OrderTree {
  private children: Map<Clock | null, Clock[]> = new Map<Clock, Clock[]>();
  private value: Map<Clock | null, string> = new Map<Clock, string>();
  private clock: Clock;
  constructor(name: string) {
    this.clock = new Clock(name);
  }

  addLeaf(paths: number[], value: string): Event {
    let parentId: Clock | null = null;
    let leftId = null;
    for (const offset of paths.slice(0, -1)) {
      const brother: Clock[] = this.children.get(parentId) ?? []; //todo 其实不应该为空;
      parentId = brother[offset] as Clock;
    }
    const brother = this.children.get(parentId) ?? [];
    leftId = brother[paths[paths.length - 1]] ?? null;
    const action = {
      type: Action.AddLeaf,
      id: this.clock.tick(),
      parentId,
      leftId,
      value,
    };
    this.applyEvent(action);
    return action;
  }

  public applyEvent(event: Event): void {
    switch (event.type) {
      case Action.AddLeaf: {
        const children = this.children.get(event.parentId) ?? [];
        let startIndex = 0;
        if (event.leftId !== null) {
          startIndex = children?.findIndex(
            (o) => o.toString() === event.leftId!.toString()
          )!;
        }
        while (true) {
          const compareTo = children[startIndex];
          if (!compareTo) {
            break;
          }
          const ord = compareTo.compare(event.id);
          if (ord === Ordering.Less) {
            startIndex++;
            continue;
          } else {
            break;
          }
        }
        children?.splice(startIndex, 0, event.id);
        this.value.set(event.id, event.value);
        this.children.set(event.parentId, children);
      }
    }
  }

  private getChildrenNodes(parentId: null | Clock): any {
    return this.children.get(parentId)?.map((id) => {
      return {
        value: this.value.get(id),
        children: this.getChildrenNodes(id),
      };
    });
  }

  public buildTree() {
    return {
      value: this.clock.actorId,
      children: this.getChildrenNodes(null),
    };
  }
}

const tree1 = new OrderTree("root-a");
const tree2 = new OrderTree("root-b");

const oa1 = tree1.addLeaf([0], "a");
const oa2 = tree1.addLeaf([0, 0], "a-a");
const oa3 = tree1.addLeaf([0, 0], "a-b");
const ob1 = tree2.addLeaf([0], "b");

tree1.applyEvent(ob1);

tree2.applyEvent(oa1);
tree2.applyEvent(oa2);
tree2.applyEvent(oa3);

console.log(JSON.stringify(tree1.buildTree(), null, 2));
console.log();
console.log(JSON.stringify(tree2.buildTree(), null, 2));
