import { Clock } from "./clock";

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
    return action;
  }

  public applyEvent(event: Event): void {
    switch (event.type) {
      case Action.AddLeaf: {
        const children = this.children.get(event.parentId);
        let startIndex = 0;
        if (event.leftId !== null) {
          startIndex = children?.findIndex(
            (o) => o.toString() === event.leftId!.toString()
          )!;
        }
      }
    }
  }

  public print() {
    const value = this.children.get(null)?.map((id) => {
      return this.value.get(id);
    });
    console.log(value);
  }
}

const tree1 = new OrderTree("root-a");
const tree2 = new OrderTree("root-b");

const oa1 = tree1.addLeaf([0], "a");
const ob1 = tree2.addLeaf([0], "b");

tree1.applyEvent(ob1);

tree2.applyEvent(oa1);
